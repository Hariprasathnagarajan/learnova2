from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status, viewsets, permissions
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from core.access import (
    resolve_course_access, resolve_enrollment_access, compute_access_status,
    grant_expiry_for, add_months, DEFAULT_GRANT_MONTHS,
)
from core.permissions import IsAdmin, IsAdminOrStaff, is_admin, is_staff
from notifications.models import Notification
from .models import Enrollment
from .serializers import EnrollmentSerializer, EnrollmentAdminSerializer


class EnrollmentViewSet(viewsets.ModelViewSet):
    """Enrolment records.

    Students can only ever READ their own enrolments. Creation happens as a
    side effect of a verified payment, or through the admin-grant endpoint -
    never by a student posting to this endpoint directly.
    """

    serializer_class = EnrollmentSerializer

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [permissions.IsAuthenticated()]
        if self.action == 'destroy':
            return [IsAdmin()]
        return [IsAdmin()]

    def get_queryset(self):
        user = self.request.user
        qs = Enrollment.objects.select_related('course', 'payment_plan', 'payment', 'user')
        if is_admin(user):
            qs = qs
        elif is_staff(user):
            qs = qs.filter(course__assigned_staff=user)
        else:
            qs = qs.filter(user=user)
        qs = qs.order_by('-enrolled_at')

        course_id = self.request.query_params.get('courseId') or self.request.query_params.get('course_id')
        if course_id:
            qs = qs.filter(course_id=course_id)
        return qs

    def get_serializer_class(self):
        return EnrollmentAdminSerializer if is_admin(self.request.user) else EnrollmentSerializer

    def create(self, request, *args, **kwargs):
        return Response({
            'error': 'Enrolments are created by completing payment. '
                     'An administrator can grant access via POST /enrollments/grant/.'
        }, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    def perform_destroy(self, instance):
        instance.delete()


class MyEnrollmentsView(APIView):
    """Explicit 'my courses' projection with access status."""

    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        enrollments = (
            Enrollment.objects
            .filter(user=request.user)
            .select_related('course', 'payment_plan', 'payment')
            .order_by('-enrolled_at')
        )
        payload = []
        for enrollment in enrollments:
            access = resolve_enrollment_access(enrollment)
            payload.append({
                'enrollment': EnrollmentSerializer(enrollment).data,
                'access': access.to_dict(),
            })
        return Response(payload)


class EnrollmentAccessView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, pk):
        enrollment = get_object_or_404(
            Enrollment.objects.select_related('course', 'payment', 'payment_plan'), pk=pk,
        )
        if enrollment.user_id != request.user.pk and not is_admin(request.user):
            raise PermissionDenied("You don't have permission to access this content.")
        return Response(resolve_enrollment_access(enrollment).to_dict())


class EnrollmentGrantView(APIView):
    """Admin-only manual access grant (spec 18: 'Manage course access')."""

    permission_classes = (IsAdmin,)

    def post(self, request):
        from courses.models import Course

        user_id = request.data.get('userId') or request.data.get('user_id')
        course_id = request.data.get('courseId') or request.data.get('course_id')
        months = request.data.get('durationMonths') or request.data.get('duration_months')

        if not user_id or not course_id:
            return Response(
                {'userId': ['This field is required.'],
                 'courseId': ['This field is required.']},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = get_object_or_404(request.user.__class__.objects.filter(is_active=True), pk=user_id)
        course = get_object_or_404(Course, pk=course_id)

        if user.role != 'student':
            return Response({'userId': ['Only students can be enrolled.']},
                            status=status.HTTP_400_BAD_REQUEST)

        enrollment, created = Enrollment.objects.get_or_create(
            user=user, course=course,
            defaults={
                'status': 'active',
                'expires_at': add_months(timezone.now(), int(months or DEFAULT_GRANT_MONTHS)),
            },
        )
        if not created:
            enrollment.status = 'active'
            enrollment.expires_at = add_months(timezone.now(), int(months or DEFAULT_GRANT_MONTHS))
            enrollment.save(update_fields=['status', 'expires_at'])

        Notification.objects.create(
            user=user,
            title='Enrollment confirmed',
            message=f'You now have access to {course.title}.',
            type='enrollment',
            course_id=course.id,
        )

        return Response(
            EnrollmentAdminSerializer(enrollment).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class EnrollmentManageView(APIView):
    """Admin-only suspend / resume / extend."""

    permission_classes = (IsAdmin,)

    def patch(self, request, pk):
        enrollment = get_object_or_404(Enrollment.objects.select_related('course', 'user'), pk=pk)
        fields = []
        new_status = request.data.get('status')
        if new_status and new_status not in dict(Enrollment.STATUS_CHOICES):
            return Response({'status': [f'Must be one of: {", ".join(dict(Enrollment.STATUS_CHOICES))}']},
                            status=status.HTTP_400_BAD_REQUEST)
        if new_status:
            enrollment.status = new_status
            fields.append('status')
            if new_status == 'completed':
                enrollment.completed_at = timezone.now()
                fields.append('completed_at')
            elif new_status == 'active':
                enrollment.completed_at = None
                fields.append('completed_at')

        months = request.data.get('extendMonths') or request.data.get('extend_months')
        if months:
            base = enrollment.expires_at or timezone.now()
            enrollment.expires_at = add_months(base, int(months))
            fields.append('expires_at')

        progress = request.data.get('progressPercent')
        if progress is not None:
            enrollment.progress_percentage = max(0, min(100, int(progress)))
            fields.append('progress_percentage')

        if fields:
            enrollment.save(update_fields=list(set(fields)))

        Notification.objects.create(
            user=enrollment.user,
            title='Enrollment updated',
            message=f'Your access to {enrollment.course.title} is now {compute_access_status(enrollment)}.',
            type='course_expiry' if enrollment.expires_at else 'enrollment',
            course_id=enrollment.course_id,
        )

        return Response(EnrollmentAdminSerializer(enrollment).data)