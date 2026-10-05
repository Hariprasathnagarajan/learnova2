from rest_framework import serializers
from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source='course.title', read_only=True)
    courseTitle = serializers.CharField(source='course.title', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    userEmail = serializers.CharField(source='user.email', read_only=True)
    studentName = serializers.SerializerMethodField()
    courseId = serializers.CharField(source='course_id', read_only=True)
    userId = serializers.CharField(source='user_id', read_only=True)
    planId = serializers.SerializerMethodField()
    planName = serializers.SerializerMethodField()
    amountInr = serializers.IntegerField(source='amount_inr', read_only=True)
    razorpayOrderId = serializers.CharField(source='order_id', read_only=True)
    razorpayPaymentId = serializers.CharField(source='payment_id', read_only=True)
    gateway = serializers.CharField(source='method', read_only=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    updatedAt = serializers.DateTimeField(source='updated_at', read_only=True)

    class Meta:
        model = Payment
        fields = (
            'id', 'order_id', 'payment_id', 'razorpayOrderId', 'razorpayPaymentId',
            'user', 'userId', 'user_email', 'userEmail', 'studentName',
            'course', 'courseId', 'course_title', 'courseTitle',
            'payment_plan', 'planId', 'planName',
            'amount_inr', 'amountInr', 'currency',
            'status', 'method', 'gateway',
            'created_at', 'createdAt', 'updated_at', 'updatedAt'
        )
        read_only_fields = fields

    def get_planId(self, obj):
        return str(obj.payment_plan_id) if obj.payment_plan_id else None

    def get_planName(self, obj):
        return obj.payment_plan.name if obj.payment_plan_id else None

    def get_studentName(self, obj):
        return obj.user.name or obj.user.email

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['id'] = str(data['id'])
        # Never leak the gateway signature to any client.
        data.pop('signature', None)
        return data