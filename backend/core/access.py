"""Server-authoritative course access resolution.

This module is the single source of truth for "may this user see protected
course content?". The mobile client never decides access - it reflects whatever
this module returns.

Access chain (spec 12):
    Authentication -> Enrollment -> Payment status -> Expiry -> Granted?
"""
from dataclasses import dataclass
from datetime import timedelta

from django.utils import timezone

# Spec 11 access states
ACCESS_ACTIVE = 'ACTIVE'
ACCESS_EXPIRING_SOON = 'EXPIRING_SOON'
ACCESS_EXPIRED = 'EXPIRED'
ACCESS_SUSPENDED = 'SUSPENDED'

EXPIRING_SOON_WINDOW = timedelta(days=7)
DEFAULT_GRANT_MONTHS = 3

# Enrollment.status values that represent a suspended learner
SUSPENDED_STATUSES = ('paused', 'cancelled')
# Enrollment.status values that still permit content access
GRANTING_STATUSES = ('active', 'completed')

DENIED_REASONS = {
    'not_authenticated': "You don't have permission to access this content.",
    'no_enrollment': "You don't have permission to access this content.",
    'suspended': 'Your enrollment for this course is suspended.',
    'expired': 'Your enrollment for this course has expired.',
    'payment_incomplete': 'Your payment for this course is incomplete.',
    'not_assigned': "You don't have permission to access this content.",
}


@dataclass
class CourseAccess:
    granted: bool
    status: str
    reason: str = ''
    enrollment_id: str = ''
    expires_at: object = None

    def to_dict(self):
        return {
            'hasAccess': self.granted,
            'accessStatus': self.status,
            'reason': self.reason,
            'enrollmentId': self.enrollment_id,
            'expiresAt': self.expires_at.isoformat() if self.expires_at else None,
        }


def compute_access_status(enrollment):
    """Derive the public access state from stored enrollment state."""
    if enrollment.status in SUSPENDED_STATUSES:
        return ACCESS_SUSPENDED
    if enrollment.expires_at and enrollment.expires_at <= timezone.now():
        return ACCESS_EXPIRED
    if enrollment.expires_at and enrollment.expires_at <= timezone.now() + EXPIRING_SOON_WINDOW:
        return ACCESS_EXPIRING_SOON
    return ACCESS_ACTIVE


def payment_is_settled(enrollment):
    """An enrollment with no linked payment was granted by an admin."""
    if enrollment.payment_id is None:
        return True
    return enrollment.payment.status == 'successful'


def resolve_enrollment_access(enrollment):
    """Build a CourseAccess for a specific enrollment, or a denial."""
    if enrollment is None:
        return CourseAccess(False, ACCESS_SUSPENDED, DENIED_REASONS['no_enrollment'])

    status = compute_access_status(enrollment)
    base = dict(
        enrollment_id=str(enrollment.id),
        expires_at=enrollment.expires_at,
    )

    if status == ACCESS_SUSPENDED:
        return CourseAccess(False, status, DENIED_REASONS['suspended'], **base)
    if status == ACCESS_EXPIRED:
        return CourseAccess(False, status, DENIED_REASONS['expired'], **base)
    if not payment_is_settled(enrollment):
        return CourseAccess(False, status, DENIED_REASONS['payment_incomplete'], **base)
    return CourseAccess(True, status, '', **base)


def resolve_course_access(user, course):
    """Full access chain for a user against a course.

    Admins bypass enrollment. Staff are limited to courses assigned to them.
    """
    from core.permissions import is_admin, is_staff
    from enrollments.models import Enrollment

    if not user or not user.is_authenticated:
        return CourseAccess(False, ACCESS_SUSPENDED, DENIED_REASONS['not_authenticated'])

    if is_admin(user):
        return CourseAccess(True, ACCESS_ACTIVE, '', '', None)

    if is_staff(user):
        if course.assigned_staff.filter(pk=user.pk).exists():
            return CourseAccess(True, ACCESS_ACTIVE, '', '', None)
        return CourseAccess(False, ACCESS_SUSPENDED, DENIED_REASONS['not_assigned'])

    enrollment = (
        Enrollment.objects
        .filter(user=user, course=course)
        .select_related('payment')
        .first()
    )
    return resolve_enrollment_access(enrollment)


def can_manage_course(user, course):
    """Write access to course sub-resources (sessions/materials/notes/plans)."""
    from core.permissions import is_admin, is_staff
    if is_admin(user):
        return True
    if is_staff(user):
        return course.assigned_staff.filter(pk=user.pk).exists()
    return False


def accessible_course_ids(user):
    """Course ids a user may read protected content for.

    Used to scope list queries so a student can never see another learner's
    courses through a listing endpoint.
    """
    from core.permissions import is_admin
    from courses.models import Course
    from enrollments.models import Enrollment

    if not user or not user.is_authenticated:
        return Course.objects.none().values_list('id', flat=True)

    if is_admin(user):
        return Course.objects.values_list('id', flat=True)

    if user.role == 'staff':
        return Course.objects.filter(assigned_staff=user).values_list('id', flat=True)

    return (
        Enrollment.objects
        .filter(user=user)
        .exclude(status__in=SUSPENDED_STATUSES)
        .values_list('course_id', flat=True)
    )


def add_months(moment, months):
    """Add whole months, clamping the day to the target month's length."""
    import calendar

    total = moment.month - 1 + months
    year = moment.year + total // 12
    month = total % 12 + 1
    day = min(moment.day, calendar.monthrange(year, month)[1])
    return moment.replace(year=year, month=month, day=day)


def grant_expiry_for(plan):
    """Default access window derived from the purchased payment plan."""
    months = getattr(plan, 'duration_months', None) or DEFAULT_GRANT_MONTHS
    return add_months(timezone.now(), int(months))