from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    LoginView, RegisterView, ProfileView,
    OtpRequestView, OtpVerifyView,
    ForgotPasswordView, PasswordResetConfirmView,
)

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('register/', RegisterView.as_view(), name='register'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('otp/request/', OtpRequestView.as_view(), name='otp_request'),
    path('otp/verify/', OtpVerifyView.as_view(), name='otp_verify'),
    path('forgot-password/', ForgotPasswordView.as_view(), name='forgot_password'),
    path('reset-password/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('profile/', ProfileView.as_view(), name='profile'),
]