import base64
import hashlib
import hmac
import json
import urllib.error
import urllib.request
import uuid

from django.conf import settings
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from core.access import grant_expiry_for
from core.permissions import is_admin, is_staff
from notifications.models import Notification
from .models import Payment
from .serializers import PaymentSerializer
from courses.models import Course, PaymentPlan
from enrollments.models import Enrollment

RAZORPAY_ORDERS_PATH = '/orders'


def razorpay_signature(order_id, payment_id, secret):
    """Razorpay's documented HMAC-SHA256 signature scheme."""
    message = f"{order_id}|{payment_id}".encode('utf-8')
    return hmac.new(secret.encode('utf-8'), message, hashlib.sha256).hexdigest()


def razorpay_is_configured():
    return bool(settings.RAZORPAY_KEY_ID and settings.RAZORPAY_KEY_SECRET)


def create_razorpay_order(order_id, amount_inr, currency='INR'):
    """Create the order on Razorpay and return the gateway's own order id.

    The client must open checkout with the id Razorpay hands back, so the
    locally generated id is only ever a placeholder until this succeeds.
    """
    credentials = f"{settings.RAZORPAY_KEY_ID}:{settings.RAZORPAY_KEY_SECRET}"
    auth = base64.b64encode(credentials.encode('utf-8')).decode('ascii')
    body = json.dumps({
        'amount': int(amount_inr) * 100,
        'currency': currency,
        'receipt': order_id,
    }).encode('utf-8')

    request = urllib.request.Request(
        f"{settings.RAZORPAY_API_BASE}{RAZORPAY_ORDERS_PATH}",
        data=body,
        method='POST',
        headers={
            'Authorization': f'Basic {auth}',
            'Content-Type': 'application/json',
        },
    )

    with urllib.request.urlopen(request, timeout=20) as response:
        return json.loads(response.read().decode('utf-8'))['id']


class CreateOrderView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        if not razorpay_is_configured():
            return Response(
                {'error': 'Payments are not configured on this server.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        course_id = request.data.get('courseId') or request.data.get('course_id')
        plan_id = request.data.get('planId') or request.data.get('plan_id')

        try:
            course = Course.objects.get(id=course_id)
        except (Course.DoesNotExist, ValueError, TypeError):
            return Response({'error': 'Course not found'}, status=status.HTTP_404_NOT_FOUND)

        plan = None
        if plan_id:
            plan = PaymentPlan.objects.filter(id=plan_id, course=course).first()

        amount_inr = plan.installment_amount_inr if plan else course.price_inr
        if not amount_inr or amount_inr <= 0:
            return Response(
                {'error': 'This course has no payable amount. Contact support if this is unexpected.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        receipt_id = f"order_{uuid.uuid4().hex[:14]}"
        try:
            gateway_order_id = create_razorpay_order(receipt_id, amount_inr)
        except (urllib.error.URLError, KeyError, ValueError, TimeoutError):
            return Response(
                {'error': 'Could not reach the payment provider. Please try again.'},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        payment = Payment.objects.create(
            order_id=gateway_order_id,
            user=request.user,
            course=course,
            payment_plan=plan,
            amount_inr=amount_inr,
            status='created',
        )

        return Response({
            'orderId': payment.order_id,
            'receiptId': receipt_id,
            'amountInr': payment.amount_inr,
            'currency': 'INR',
            'courseId': str(course.id),
            'planId': str(plan.id) if plan else None,
            'durationMonths': plan.duration_months if plan else None,
            'razorpayKeyId': settings.RAZORPAY_KEY_ID,
        }, status=status.HTTP_201_CREATED)


class VerifyPaymentView(APIView):
    """Signature-verified settlement.

    A payment is only ever marked successful when the gateway signature
    validates against the server-side secret. The secret never leaves the
    backend, so a client cannot forge a settlement.
    """

    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        order_id = (
            request.data.get('orderId') or
            request.data.get('razorpayOrderId') or
            request.data.get('razorpay_order_id')
        )
        payment_id = (
            request.data.get('paymentId') or
            request.data.get('razorpayPaymentId') or
            request.data.get('razorpay_payment_id')
        )
        signature = (
            request.data.get('signature') or
            request.data.get('razorpaySignature') or
            request.data.get('razorpay_signature')
        )

        if not order_id or not payment_id or not signature:
            return Response(
                {'error': 'orderId, paymentId and signature are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        payment = Payment.objects.filter(order_id=order_id).select_related('course', 'user').first()
        if not payment:
            return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

        # Never let one user settle another user's order.
        if payment.user_id != request.user.pk and not is_admin(request.user):
            return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

        if payment.status == 'successful':
            return Response({'error': 'This order has already been settled.'},
                            status=status.HTTP_400_BAD_REQUEST)

        secret = settings.RAZORPAY_KEY_SECRET
        if not secret:
            return Response(
                {'error': 'Payment verification is not configured on this server.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        expected = razorpay_signature(order_id, payment_id, secret)
        if not hmac.compare_digest(expected, str(signature)):
            Payment.objects.filter(pk=payment.pk).update(status='failed')
            return Response(
                {'error': 'Payment verification failed. If you were charged, contact support.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        payment.payment_id = payment_id
        payment.signature = signature
        payment.status = 'successful'
        payment.save(update_fields=['payment_id', 'signature', 'status', 'updated_at'])

        enrollment, created = Enrollment.objects.get_or_create(
            user=payment.user,
            course=payment.course,
            defaults={
                'payment_plan': payment.payment_plan,
                'payment': payment,
                'status': 'active',
                'expires_at': grant_expiry_for(payment.payment_plan),
            },
        )
        if not created:
            enrollment.payment = payment
            enrollment.payment_plan = payment.payment_plan
            enrollment.status = 'active'
            enrollment.expires_at = grant_expiry_for(payment.payment_plan)
            enrollment.save(update_fields=['payment', 'payment_plan', 'status', 'expires_at'])

        Course.objects.filter(pk=payment.course_id).update(
            total_enrolled=payment.course.enrollments.count()
        )
        Notification.objects.create(
            user=payment.user,
            title='Payment successful',
            message=f'Your enrolment in {payment.course.title} is active.',
            type='payment_success',
            course_id=payment.course_id,
        )

        return Response({
            'success': True,
            'orderId': payment.order_id,
            'paymentId': payment.payment_id,
            'courseId': str(payment.course_id),
            'enrollmentId': str(enrollment.id),
            'accessStatus': enrollment.access_status,
            'expiresAt': enrollment.expires_at.isoformat() if enrollment.expires_at else None,
        })


class PaymentHistoryView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        user = request.user
        course_id = request.query_params.get('courseId')

        if is_admin(user):
            qs = Payment.objects.all()
        elif is_staff(user):
            qs = Payment.objects.filter(course__assigned_staff=user)
        else:
            qs = Payment.objects.filter(user=user)

        if course_id:
            qs = qs.filter(course_id=course_id)

        qs = qs.select_related('course', 'user', 'payment_plan').order_by('-created_at')
        return Response(PaymentSerializer(qs, many=True).data)


class StaffCoursePaymentsView(APIView):
    """Payments against courses a staff member is assigned to."""

    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, course_id):
        from core.access import can_manage_course
        course = get_object_or_404(Course, pk=course_id)
        if not can_manage_course(request.user, course):
            return Response({'error': "You don't have permission to access this content."},
                            status=status.HTTP_403_FORBIDDEN)
        qs = (Payment.objects.filter(course=course)
              .select_related('user', 'payment_plan')
              .order_by('-created_at'))
        return Response(PaymentSerializer(qs, many=True).data)


class StaffCourseStudentsView(APIView):
    """Learners enrolled in a staff member's course."""

    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, course_id):
        from core.access import can_manage_course
        course = get_object_or_404(Course, pk=course_id)
        if not can_manage_course(request.user, course):
            return Response({'error': "You don't have permission to access this content."},
                            status=status.HTTP_403_FORBIDDEN)
        enrollments = (
            Enrollment.objects.filter(course=course)
            .select_related('user', 'payment')
            .order_by('-enrolled_at')
        )
        return Response([
            {
                'enrollmentId': str(e.id),
                'student': {
                    'id': str(e.user_id),
                    'email': e.user.email,
                    'name': e.user.name or e.user.email,
                    'phone': e.user.phone,
                    'avatar': e.user.avatar_url or '',
                },
                'status': e.status,
                'accessStatus': e.access_status,
                'progressPercent': e.progress_percentage,
                'expiresAt': e.expires_at.isoformat() if e.expires_at else None,
                'enrolledAt': e.enrolled_at.isoformat(),
            }
            for e in enrollments
        ])