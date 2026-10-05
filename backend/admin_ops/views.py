from datetime import datetime, timedelta, timezone as dt_timezone

from django.db.models import Count, Q, Sum
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import IsAdmin, IsAdminOrStaff, is_admin
from accounts.models import User
from courses.models import Course, Session
from enrollments.models import Enrollment
from notifications.models import Notification
from payments.models import Payment
from payments.serializers import PaymentSerializer


class AdminDashboardView(APIView):
    """Admin-only. Every figure is computed from the database.

    There are no hardcoded fallbacks - an empty database reports zeroes, it
    never reports invented revenue.
    """

    permission_classes = (IsAdmin,)

    def get(self, request):
        revenue = Payment.objects.filter(status='successful').aggregate(total=Sum('amount_inr'))['total'] or 0
        active_enrollments = Enrollment.objects.exclude(
            status__in=('cancelled', 'paused')
        ).count()

        recent_payments = (
            Payment.objects.select_related('user', 'course', 'payment_plan')
            .order_by('-created_at')[:5]
        )

        return Response({
            'totalRevenueInr': revenue,
            'totalStudents': User.objects.filter(role='student').count(),
            'totalCourses': Course.objects.count(),
            'activeCourses': Course.objects.filter(is_published=True).count(),
            'totalEnrolled': Enrollment.objects.count(),
            'activeEnrollments': active_enrollments,
            'totalUsers': User.objects.filter(is_active=True).count(),
            'totalSessions': Session.objects.count(),
            'unreadNotifications': Notification.objects.filter(user=request.user, is_read=False).count(),
            'monthlyGrowthPercent': self._growth_percent(),
            'recentPayments': PaymentSerializer(recent_payments, many=True).data,
            'monthlyRevenue': self._monthly_revenue(),
        })

    def _monthly_revenue(self, months=6):
        now = timezone.now()
        buckets = []
        for offset in range(months - 1, -1, -1):
            year = now.year
            month = now.month - offset
            while month <= 0:
                month += 12
                year -= 1
            start = timezone.datetime(year, month, 1, tzinfo=dt_timezone.utc)
            end = (start + timedelta(days=32)).replace(day=1)
            total = Payment.objects.filter(
                status='successful', created_at__gte=start, created_at__lt=end,
            ).aggregate(total=Sum('amount_inr'))['total'] or 0
            buckets.append({'month': start.strftime('%b'), 'revenue': total})
        return buckets

    def _growth_percent(self):
        now = timezone.now()
        this_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        last_month = (this_month - timedelta(days=1)).replace(day=1)

        def total_since(moment):
            return Payment.objects.filter(
                status='successful', created_at__gte=moment,
            ).aggregate(total=Sum('amount_inr'))['total'] or 0

        current, previous = total_since(this_month), total_since(last_month)
        if previous == 0:
            return 100.0 if current > 0 else 0.0
        return round(((current - previous) / previous) * 100, 1)


class StaffDashboardView(APIView):
    """Scoped to the staff member's assigned courses."""

    permission_classes = (IsAdminOrStaff,)

    def get(self, request):
        courses = Course.objects.filter(assigned_staff=request.user) if not is_admin(request.user) \
            else Course.objects.all()

        assigned_ids = list(courses.values_list('id', flat=True))
        upcoming = (
            Session.objects.filter(course_id__in=assigned_ids, start_time__gte=timezone.now())
            .select_related('course')
            .order_by('start_time')[:5]
        )

        return Response({
            'assignedCourses': [
                {
                    'id': str(c.id),
                    'title': c.title,
                    'category': c.category,
                    'isPublished': c.is_published,
                    'enrolledCount': Enrollment.objects.filter(course=c).count(),
                    'sessionCount': Session.objects.filter(course=c).count(),
                    'thumbnail': c.thumbnail_url or '',
                }
                for c in courses
            ],
            'assignedCourseCount': courses.count(),
            'myStudents': Enrollment.objects.filter(course_id__in=assigned_ids)
                .exclude(status__in=('cancelled',)).count(),
            'upcomingSessions': [
                {
                    'id': str(s.id),
                    'courseId': str(s.course_id),
                    'courseTitle': s.course.title,
                    'title': s.title,
                    'scheduledAt': s.start_time.isoformat(),
                    'platform': s.platform,
                    'status': s.status,
                }
                for s in upcoming
            ],
            'unreadNotifications': Notification.objects.filter(
                user=request.user, is_read=False).count(),
        })


class NotificationCreateView(APIView):
    """Admin/staff broadcast or targeted notification."""

    permission_classes = (IsAdminOrStaff,)

    def post(self, request):
        title = request.data.get('title', '').strip()
        message = request.data.get('message', '').strip()
        kind = request.data.get('type', 'announcement')
        user_id = request.data.get('userId')
        course_id = request.data.get('courseId')

        errors = {}
        if not title:
            errors['title'] = ['This field is required.']
        if not message:
            errors['message'] = ['This field is required.']
        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        valid_types = {choice for choice, _ in Notification.TYPE_CHOICES}
        if kind not in valid_types:
            return Response({'type': [f'Must be one of: {", ".join(sorted(valid_types))}']},
                            status=status.HTTP_400_BAD_REQUEST)

        if user_id:
            targets = list(User.objects.filter(pk=user_id))
            if not targets:
                return Response({'userId': ['No such user.']}, status=status.HTTP_404_NOT_FOUND)
        elif course_id:
            targets = list(User.objects.filter(
                enrollments__course_id=course_id).distinct())
        elif is_admin(request.user):
            targets = list(User.objects.filter(is_active=True))
        else:
            targets = [request.user]

        created = Notification.objects.bulk_create([
            Notification(user=u, title=title, message=message, type=kind,
                         course_id=course_id or None)
            for u in targets
        ])
        return Response({'created': len(created)}, status=status.HTTP_201_CREATED)


class AdminUserCourseAssignmentView(APIView):
    """Assign or unassign staff to a course (spec 19: assigned courses)."""

    permission_classes = (IsAdmin,)

    def post(self, request, pk):
        course = Course.objects.filter(pk=pk).first()
        if not course:
            return Response({'error': 'Course not found'}, status=status.HTTP_404_NOT_FOUND)

        staff_id = request.data.get('staffId') or request.data.get('userId')
        staff = User.objects.filter(pk=staff_id, role='staff').first() if staff_id else None
        if not staff:
            return Response({'staffId': ['A valid staff user is required.']},
                            status=status.HTTP_400_BAD_REQUEST)

        if request.data.get('assigned') is False:
            course.assigned_staff.remove(staff)
        else:
            course.assigned_staff.add(staff)
            if not course.instructor_name or course.instructor_name == 'Learnova Faculty':
                course.instructor_name = staff.name or staff.email
                course.save(update_fields=['instructor_name'])

        return Response({
            'courseId': str(course.id),
            'assignedStaff': [
                {'id': str(s.id), 'email': s.email, 'name': s.name}
                for s in course.assigned_staff.all()
            ],
        })