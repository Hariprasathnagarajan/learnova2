from rest_framework import serializers
from .models import Enrollment
from courses.serializers import CourseListSerializer


class EnrollmentSerializer(serializers.ModelSerializer):
    course = CourseListSerializer(read_only=True)
    courseId = serializers.CharField(source='course_id', read_only=True)
    userId = serializers.CharField(source='user_id', read_only=True)
    paymentPlanId = serializers.SerializerMethodField()
    progressPercent = serializers.IntegerField(source='progress_percentage', read_only=True)
    enrolledAt = serializers.DateTimeField(source='enrolled_at', read_only=True)
    expiresAt = serializers.DateTimeField(source='expires_at', read_only=True)
    accessStatus = serializers.SerializerMethodField()
    hasAccess = serializers.SerializerMethodField()
    paymentStatus = serializers.SerializerMethodField()

    class Meta:
        model = Enrollment
        fields = (
            'id', 'user', 'userId', 'course', 'courseId',
            'payment_plan', 'paymentPlanId', 'payment', 'paymentStatus',
            'status', 'accessStatus', 'hasAccess',
            'progress_percentage', 'progressPercent',
            'expires_at', 'expiresAt',
            'enrolled_at', 'enrolledAt', 'completed_at',
        )
        read_only_fields = ('id', 'user', 'enrolled_at', 'expires_at')

    def get_paymentPlanId(self, obj):
        return str(obj.payment_plan_id) if obj.payment_plan_id else None

    def get_accessStatus(self, obj):
        return obj.access_status

    def get_hasAccess(self, obj):
        from core.access import resolve_enrollment_access
        return resolve_enrollment_access(obj).granted

    def get_paymentStatus(self, obj):
        return obj.payment.status if obj.payment_id else 'admin_granted'

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['id'] = str(data['id'])
        return data


class EnrollmentAdminSerializer(EnrollmentSerializer):
    """Adds write fields for the admin-only management endpoints."""

    class Meta(EnrollmentSerializer.Meta):
        fields = EnrollmentSerializer.Meta.fields + ('progress_percentage',)
        read_only_fields = ('id', 'user', 'course', 'enrolled_at')