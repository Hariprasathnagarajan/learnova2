from datetime import timedelta
import uuid

from django.conf import settings
from django.core import signing
from django.http import FileResponse, Http404
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import viewsets, permissions, status as http_status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from core.access import resolve_course_access, can_manage_course
from core.permissions import IsAdmin, IsAdminOrStaff, is_admin, is_staff
from notifications.models import Notification
from .models import Course, PaymentPlan, Session, Material, Note
from .serializers import (
    CourseListSerializer, CourseDetailSerializer, CourseWriteSerializer,
    PaymentPlanSerializer, PaymentPlanWriteSerializer,
    SessionSerializer, SessionWriteSerializer,
    MaterialSerializer, MaterialWriteSerializer,
    NoteSerializer, NoteWriteSerializer,
)


def is_student_role(user):
    return bool(user and user.is_authenticated and user.role == 'student')


def _unique_slug(title, instance=None):
    from django.utils.text import slugify
    base = slugify(title) or 'course'
    candidate, counter = base, 2
    while Course.objects.filter(slug=candidate).exclude(pk=instance.pk if instance else None).exists():
        candidate = f"{base}-{counter}"
        counter += 1
    return candidate


def _notify(user, title, message, kind, course_id=None):
    Notification.objects.create(
        user=user, title=title, message=message, type=kind, course_id=course_id,
    )


def _notify_enrolled_students(course, title, message, kind):
    from enrollments.models import Enrollment
    for enrollment in Enrollment.objects.filter(course=course).exclude(
        status__in=('cancelled',)
    ).select_related('user'):
        _notify(enrollment.user, title, message, kind, course.id)


class CourseViewSet(viewsets.ModelViewSet):
    """Public catalogue reads; admin/staff writes only.

    Protected sub-resources are deliberately NOT embedded in the anonymous
    detail payload - they require an enrolment check.
    """

    def get_queryset(self):
        qs = Course.objects.select_related().prefetch_related('payment_plans')
        if is_admin(self.request.user):
            return qs.order_by('-created_at')
        return qs.filter(is_published=True).order_by('-created_at')

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return CourseWriteSerializer
        if self.action == 'retrieve':
            return CourseDetailSerializer
        return CourseListSerializer

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [permissions.AllowAny()]
        if self.action in ('create', 'destroy'):
            return [IsAdmin()]
        return [IsAdminOrStaff()]

    def perform_create(self, serializer):
        course = serializer.save()
        if is_staff(self.request.user):
            course.assigned_staff.add(self.request.user)
        return course

    def create(self, request, *args, **kwargs):
        write = self.get_serializer(data=request.data)
        write.is_valid(raise_exception=True)
        course = self.perform_create(write)
        return Response(
            CourseListSerializer(course, context=self.get_serializer_context()).data,
            status=http_status.HTTP_201_CREATED,
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        write = self.get_serializer(instance, data=request.data, partial=partial)
        write.is_valid(raise_exception=True)
        self.perform_update(write)
        return Response(
            CourseListSerializer(self.get_object(), context=self.get_serializer_context()).data
        )

    def perform_update(self, serializer):
        course = serializer.instance
        if is_staff(self.request.user) and not course.assigned_staff.filter(pk=self.request.user.pk).exists():
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You don't have permission to modify this course.")
        serializer.save()

    def perform_destroy(self, instance):
        instance.delete()


class CourseDetailProtectedView(APIView):
    """Course detail that includes protected content when access is granted."""

    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, pk):
        course = get_object_or_404(Course, pk=pk)
        if not course.is_published and not is_admin(request.user):
            from rest_framework.exceptions import NotFound
            raise NotFound('Course not found.')

        access = resolve_course_access(request.user, course)
        data = CourseDetailSerializer(course).data
        data['access'] = access.to_dict()

        if access.granted:
            data['sessions'] = SessionSerializer(
                Session.objects.filter(course=course).order_by('start_time'), many=True).data
            data['materials'] = MaterialSerializer(
                Material.objects.filter(course=course).order_by('-created_at'), many=True).data
            data['notes'] = NoteSerializer(
                Note.objects.filter(course=course).order_by('-updated_at'), many=True).data
        else:
            # Never leak the existence of protected resources to a denied user.
            data['sessions'] = []
            data['materials'] = []
            data['notes'] = []
        return Response(data)


class CourseAccessView(APIView):
    """Ask the server whether the current user may access a course."""

    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, pk):
        course = get_object_or_404(Course, pk=pk)
        access = resolve_course_access(request.user, course)
        return Response(access.to_dict())


class CourseSessionsListView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, course_id):
        course = get_object_or_404(Course, pk=course_id)
        access = resolve_course_access(request.user, course)
        if not access.granted and not is_admin(request.user):
            return Response({'error': access.reason, 'access': access.to_dict()},
                            status=http_status.HTTP_403_FORBIDDEN)
        sessions = Session.objects.filter(course=course).order_by('start_time')
        return Response({
            'access': access.to_dict(),
            'results': SessionSerializer(sessions, many=True).data,
        })


class CourseMaterialsListView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, course_id):
        course = get_object_or_404(Course, pk=course_id)
        access = resolve_course_access(request.user, course)
        if not access.granted and not is_admin(request.user):
            return Response({'error': access.reason, 'access': access.to_dict()},
                            status=http_status.HTTP_403_FORBIDDEN)
        materials = Material.objects.filter(course=course).order_by('-created_at')
        return Response({
            'access': access.to_dict(),
            'results': MaterialSerializer(materials, many=True).data,
        })


class CourseNotesListView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, course_id):
        course = get_object_or_404(Course, pk=course_id)
        access = resolve_course_access(request.user, course)
        if not access.granted and not is_admin(request.user):
            return Response({'error': access.reason, 'access': access.to_dict()},
                            status=http_status.HTTP_403_FORBIDDEN)
        notes = Note.objects.filter(course=course).select_related('author').order_by('-updated_at')
        return Response({
            'access': access.to_dict(),
            'results': NoteSerializer(notes, many=True).data,
        })


class CoursePaymentPlansView(APIView):
    """Payment plans are public catalogue data (spec 10)."""

    permission_classes = (permissions.AllowAny,)

    def get(self, request, course_id):
        course = get_object_or_404(Course, pk=course_id)
        plans = course.payment_plans.all().order_by('price_inr')
        return Response(PaymentPlanSerializer(plans, many=True).data)


class SessionJoinView(APIView):
    """Authorised meeting hand-off.

    Verifies authentication, role, enrolment, payment, course expiry and
    session availability before releasing a join destination. The raw
    meeting URL is never persisted or logged client-side; it is only returned
    as a redirect target at the moment of joining.
    """

    permission_classes = (permissions.IsAuthenticated,)

    JOIN_WINDOW_MINUTES_BEFORE = 15
    JOIN_WINDOW_MINUTES_AFTER = 120

    def _decide(self, request, session):
        from core.permissions import is_privileged
        course = session.course

        if is_privileged(request.user):
            return None, {}

        if not is_student_role(request.user):
            return http_status.HTTP_403_FORBIDDEN, {
                'error': "You don't have permission to access this content."}

        access = resolve_course_access(request.user, course)
        if not access.granted:
            return http_status.HTTP_403_FORBIDDEN, {
                'error': access.reason, 'access': access.to_dict()}

        if session.status == 'cancelled':
            return http_status.HTTP_403_FORBIDDEN, {'error': 'This session has been cancelled.'}

        if session.status == 'completed':
            return http_status.HTTP_403_FORBIDDEN, {
                'error': 'This session has already ended.'}

        now = timezone.now()
        start = session.start_time
        window_start = start - timedelta(minutes=self.JOIN_WINDOW_MINUTES_BEFORE)
        window_end = start + timedelta(minutes=self.JOIN_WINDOW_MINUTES_AFTER)
        if now < window_start:
            return http_status.HTTP_403_FORBIDDEN, {
                'error': 'This session has not started yet.',
                'startsAt': start.isoformat(),
            }
        if now > window_end:
            return http_status.HTTP_403_FORBIDDEN, {'error': 'The join window for this session has closed.'}

        return None, {}

    def _respond(self, request, session_id):
        session = get_object_or_404(
            Session.objects.select_related('course').prefetch_related('course__assigned_staff'),
            pk=session_id,
        )
        code, payload = self._decide(request, session)
        if code:
            return Response(payload, status=code)

        sid = str(session.id)
        default_slug = f"lnv-{sid.zfill(7)[:3]}-{sid.zfill(7)[-4:]}"
        join_url = session.meeting_url or f"https://meet.google.com/{default_slug}"

        response = Response({
            'sessionId': sid,
            'title': session.title,
            'joinUrl': join_url,
            'platform': session.platform,
            'status': session.status,
            'startsAt': session.start_time.isoformat(),
            'durationMinutes': session.duration_minutes,
        })
        # The join URL is a one-time hand-off: never let it sit in a shared cache.
        response['Cache-Control'] = 'no-store, private'
        response['Referrer-Policy'] = 'no-referrer'
        return response

    def post(self, request, session_id):
        return self._respond(request, session_id)

    def get(self, request, session_id):
        return self._respond(request, session_id)


class SessionAdminDetailView(APIView):
    """Meeting coordinates for admin/staff only. Never exposed to students."""

    permission_classes = (IsAdminOrStaff,)

    def get(self, request, session_id):
        session = get_object_or_404(Session.objects.select_related('course'), pk=session_id)
        if is_staff(request.user) and not session.course.assigned_staff.filter(pk=request.user.pk).exists():
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You don't have permission to access this content.")

        sid = str(session.id)
        default_slug = f"lnv-{sid.zfill(7)[:3]}-{sid.zfill(7)[-4:]}"
        return Response({
            'id': sid,
            'courseId': str(session.course_id),
            'title': session.title,
            'description': session.description,
            'scheduledAt': session.start_time.isoformat(),
            'durationMinutes': session.duration_minutes,
            'platform': session.platform,
            'isCompleted': session.status == 'completed',
            'recordingAvailable': False,
            'meetingUrl': session.meeting_url or f"https://meet.google.com/{default_slug}",
            'meetingId': session.meeting_id or f"meet-{session.id}",
            'meetingPassword': session.passcode or '',
        })


class MaterialDetailView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, pk):
        material = get_object_or_404(Material.objects.select_related('course'), pk=pk)
        access = resolve_course_access(request.user, material.course)
        if not access.granted:
            return Response({'canAccess': False, 'reason': access.reason,
                             'access': access.to_dict()},
                            status=http_status.HTTP_403_FORBIDDEN)
        return Response(MaterialSerializer(material).data)


class MaterialAccessView(APIView):
    """Temporary, watermarked, enrolment-gated access to a protected file."""

    permission_classes = (permissions.IsAuthenticated,)

    def _access_response(self, request, material_id):
        material = get_object_or_404(
            Material.objects.select_related('course').prefetch_related('course__assigned_staff'),
            pk=material_id,
        )
        access = resolve_course_access(request.user, material.course)
        if not access.granted:
            return Response({
                'canAccess': False,
                'reason': access.reason,
                'access': access.to_dict(),
            }, status=http_status.HTTP_403_FORBIDDEN)

        if not material.source:
            return Response({
                'canAccess': False,
                'reason': 'This material is not available yet.',
            }, status=http_status.HTTP_404_NOT_FOUND)

        viewer_token = signing.dumps(
            {'m': material.id, 'u': request.user.pk}, salt='material-viewer'
        )
        user_email = request.user.email
        user_id = str(request.user.pk)
        watermark_text = f"{user_email} • {user_id} • Learnova Protected Content"

        # The bytes are never served from a guessable path. They are streamed
        # by MaterialStreamView, which re-verifies this short-lived token and
        # re-checks enrolment on every single request.
        response = Response({
            'canAccess': True,
            'material': MaterialSerializer(material).data,
            'materialId': str(material.id),
            'title': material.title,
            'type': material.type,
            'streamUrl': f'/api/v1/materials/{material.id}/stream/?token={viewer_token}',
            'viewerToken': viewer_token,
            'expiresInSeconds': 900,
            'securityWatermark': watermark_text,
            'access': access.to_dict(),
            'watermark': {
                'userEmail': user_email,
                'userId': user_id,
                'issuedAt': timezone.now().isoformat(),
                'ip': request.META.get('REMOTE_ADDR', ''),
            },
        })
        response['Cache-Control'] = 'no-store, private'
        return response

    def get(self, request, material_id):
        return self._access_response(request, material_id)

    def post(self, request, material_id):
        return self._access_response(request, material_id)


class MaterialStreamView(APIView):
    """Streams protected material bytes for a viewer holding a valid,
    unexpired viewer token. Enrolment is re-checked here, so revoking access
    takes effect immediately even if a token was already issued."""

    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, material_id):
        token = request.query_params.get('token', '')
        try:
            payload = signing.loads(
                token, salt='material-viewer', max_age=settings.MATERIAL_VIEWER_TTL_SECONDS
            )
        except signing.BadSignature:
            raise Http404('Viewer token is invalid or has expired.')

        if str(payload.get('u')) != str(request.user.pk):
            raise Http404('Viewer token does not belong to this account.')

        material = get_object_or_404(
            Material.objects.select_related('course').prefetch_related('course__assigned_staff'),
            pk=material_id,
        )
        access = resolve_course_access(request.user, material.course)
        if not access.granted:
            return Response({'detail': 'Access to this material has been revoked.'},
                            status=http_status.HTTP_403_FORBIDDEN)

        if not material.file:
            if material.file_url:
                return Response({'redirect': material.file_url})
            raise Http404('This material has no stored file.')

        handle = material.file.open('rb')
        response = FileResponse(handle, content_type='application/octet-stream')
        response['Content-Disposition'] = (
            f'inline; filename="{material.file.name.rsplit("/", 1)[-1]}"'
        )
        response['Content-Length'] = str(material.file.size)
        response['Cache-Control'] = 'no-store, private'
        response['X-Content-Type-Options'] = 'nosniff'
        return response


# ---------------------------------------------------------------------------
# Admin / staff write endpoints (spec 18, 19, 20)
# ---------------------------------------------------------------------------

class CourseSessionWriteView(APIView):
    permission_classes = (IsAdminOrStaff,)
    parser_classes = (JSONParser, MultiPartParser, FormParser)

    def post(self, request, course_id):
        course = get_object_or_404(Course, pk=course_id)
        if not can_manage_course(request.user, course):
            return Response({"error": "You don't have permission to access this content."},
                            status=http_status.HTTP_403_FORBIDDEN)
        serializer = SessionWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        session = serializer.save(course=course)

        _notify_enrolled_students(
            course, 'New session scheduled',
            f"{session.title} on {session.start_time:%d %b %Y, %H:%M} UTC",
            'session_reminder',
        )
        return Response(SessionSerializer(session).data, status=http_status.HTTP_201_CREATED)

    def patch(self, request, course_id, session_id):
        course = get_object_or_404(Course, pk=course_id)
        if not can_manage_course(request.user, course):
            return Response({"error": "You don't have permission to access this content."},
                            status=http_status.HTTP_403_FORBIDDEN)
        session = get_object_or_404(Session, pk=session_id, course=course)
        serializer = SessionWriteSerializer(session, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        return Response(SessionSerializer(serializer.save()).data)


class CourseMaterialWriteView(APIView):
    """Multipart upload for admin/staff (spec 20)."""

    permission_classes = (IsAdminOrStaff,)
    parser_classes = (MultiPartParser, FormParser)

    ALLOWED_TYPES = {'application/pdf', 'image/png', 'image/jpeg', 'image/webp'}

    def post(self, request, course_id):
        course = get_object_or_404(Course, pk=course_id)
        if not can_manage_course(request.user, course):
            return Response({"error": "You don't have permission to access this content."},
                            status=http_status.HTTP_403_FORBIDDEN)

        upload = request.FILES.get('file')
        if upload and upload.content_type not in self.ALLOWED_TYPES:
            return Response({'file': ['Only PDF, PNG, JPEG or WebP files are allowed.']},
                            status=http_status.HTTP_400_BAD_REQUEST)

        serializer = MaterialWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        material = serializer.save(course=course, created_by=request.user)

        _notify_enrolled_students(
            course, 'New material available',
            f"{material.title} was added to {course.title}.", 'material_added',
        )
        return Response(MaterialSerializer(material).data, status=http_status.HTTP_201_CREATED)

    def patch(self, request, course_id, material_id):
        course = get_object_or_404(Course, pk=course_id)
        if not can_manage_course(request.user, course):
            return Response({"error": "You don't have permission to access this content."},
                            status=http_status.HTTP_403_FORBIDDEN)
        material = get_object_or_404(Material, pk=material_id, course=course)
        serializer = MaterialWriteSerializer(material, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        return Response(MaterialSerializer(serializer.save()).data)

    def delete(self, request, course_id, material_id):
        course = get_object_or_404(Course, pk=course_id)
        if not can_manage_course(request.user, course):
            return Response({"error": "You don't have permission to access this content."},
                            status=http_status.HTTP_403_FORBIDDEN)
        material = get_object_or_404(Material, pk=material_id, course=course)
        material.delete()
        return Response(status=http_status.HTTP_204_NO_CONTENT)


class CourseNoteWriteView(APIView):
    permission_classes = (IsAdminOrStaff,)
    parser_classes = (JSONParser, MultiPartParser, FormParser)

    def post(self, request, course_id):
        course = get_object_or_404(Course, pk=course_id)
        if not can_manage_course(request.user, course):
            return Response({"error": "You don't have permission to access this content."},
                            status=http_status.HTTP_403_FORBIDDEN)
        serializer = NoteWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        note = serializer.save(course=course, author=request.user)
        _notify_enrolled_students(
            course, 'New note published', f"{note.title} was added to {course.title}.", 'note_added',
        )
        return Response(NoteSerializer(note).data, status=http_status.HTTP_201_CREATED)

    def patch(self, request, course_id, note_id):
        course = get_object_or_404(Course, pk=course_id)
        if not can_manage_course(request.user, course):
            return Response({"error": "You don't have permission to access this content."},
                            status=http_status.HTTP_403_FORBIDDEN)
        note = get_object_or_404(Note, pk=note_id, course=course)
        serializer = NoteWriteSerializer(note, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        return Response(NoteSerializer(serializer.save()).data)

    def delete(self, request, course_id, note_id):
        course = get_object_or_404(Course, pk=course_id)
        if not can_manage_course(request.user, course):
            return Response({"error": "You don't have permission to access this content."},
                            status=http_status.HTTP_403_FORBIDDEN)
        note = get_object_or_404(Note, pk=note_id, course=course)
        note.delete()
        return Response(status=http_status.HTTP_204_NO_CONTENT)


class CoursePaymentPlanWriteView(APIView):
    permission_classes = (IsAdminOrStaff,)
    parser_classes = (JSONParser,)

    def post(self, request, course_id):
        course = get_object_or_404(Course, pk=course_id)
        if not can_manage_course(request.user, course):
            return Response({"error": "You don't have permission to access this content."},
                            status=http_status.HTTP_403_FORBIDDEN)
        serializer = PaymentPlanWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        plan = serializer.save(course=course)
        return Response(PaymentPlanSerializer(plan).data, status=http_status.HTTP_201_CREATED)

    def patch(self, request, course_id, plan_id):
        course = get_object_or_404(Course, pk=course_id)
        if not can_manage_course(request.user, course):
            return Response({"error": "You don't have permission to access this content."},
                            status=http_status.HTTP_403_FORBIDDEN)
        plan = get_object_or_404(PaymentPlan, pk=plan_id, course=course)
        serializer = PaymentPlanWriteSerializer(plan, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        return Response(PaymentPlanSerializer(serializer.save()).data)

    def delete(self, request, course_id, plan_id):
        course = get_object_or_404(Course, pk=course_id)
        if not can_manage_course(request.user, course):
            return Response({"error": "You don't have permission to access this content."},
                            status=http_status.HTTP_403_FORBIDDEN)
        get_object_or_404(PaymentPlan, pk=plan_id, course=course).delete()
        return Response(status=http_status.HTTP_204_NO_CONTENT)