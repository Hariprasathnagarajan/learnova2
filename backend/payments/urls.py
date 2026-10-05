from django.urls import path
from .views import (
    CreateOrderView, VerifyPaymentView, PaymentHistoryView,
    StaffCoursePaymentsView, StaffCourseStudentsView,
)

urlpatterns = [
    path('', PaymentHistoryView.as_view(), name='payment_history'),
    path('create-order/', CreateOrderView.as_view(), name='create_order'),
    path('verify/', VerifyPaymentView.as_view(), name='verify_payment'),
    path('course/<int:course_id>/', StaffCoursePaymentsView.as_view(), name='course_payments'),
    path('course/<int:course_id>/students/', StaffCourseStudentsView.as_view(), name='course_students'),
]