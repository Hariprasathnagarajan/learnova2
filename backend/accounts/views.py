from rest_framework import status, permissions, viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.core.mail import send_mail
from django.conf import settings

from core.permissions import IsAdmin, IsAdminOrStaff, is_admin
from .models import User, OTPChallenge
from .serializers import (
    UserSerializer, AdminUserSerializer, StaffUserSerializer,
    RegisterSerializer, CreateStaffSerializer,
)


class LoginView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        password = request.data.get('password', '')

        user = authenticate(request, username=email, password=password)
        if not user:
            try:
                existing = User.objects.get(email=email)
                if not existing.is_active:
                    return Response({'error': 'Account is suspended or deactivated'}, status=status.HTTP_403_FORBIDDEN)
            except User.DoesNotExist:
                pass
            return Response({'error': 'Invalid email or password'}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.is_active:
            return Response({'error': 'Account is suspended'}, status=status.HTTP_403_FORBIDDEN)

        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            }
        })


class RegisterView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                'user': UserSerializer(user).data,
                'tokens': {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                }
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProfileView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    #: Fields a user may never change on their own profile.
    PROTECTED_FIELDS = ('role', 'is_active', 'is_staff', 'is_superuser', 'is_email_verified')

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        attempted = [f for f in self.PROTECTED_FIELDS if f in request.data]
        if attempted:
            return Response(
                {f: ['This field cannot be changed here.'] for f in attempted},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


def issue_otp(email, purpose):
    """Generate and deliver a one-time code. Returns the code in DEBUG only."""
    _challenge, code = OTPChallenge.issue(email, purpose)

    if purpose == 'password_reset':
        send_mail(
            'Learnova password reset code',
            f'Your verification code is {code}. It expires in '
            f'{OTPChallenge.OTP_TTL_MINUTES} minutes.',
            None,
            [email],
            fail_silently=True,
        )
    elif settings.DEBUG:
        # Never expose a live code outside DEBUG.
        print(f'[DEV] OTP for {email} ({purpose}): {code}')
    return code


def consume_otp(email, purpose, submitted):
    """Validate and burn an OTP. Returns (ok, reason)."""
    return OTPChallenge.verify(email, purpose, submitted)


class OtpRequestView(APIView):
    """Step 1 of email verification - sends a code, never returns it."""
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        if not email or not User.objects.filter(email=email).exists():
            # Do not disclose account existence.
            return Response({'message': 'If the account exists, a code has been sent.'},
                            status=status.HTTP_202_ACCEPTED)
        issue_otp(email, 'verify')
        return Response({'message': 'Verification code sent.'}, status=status.HTTP_202_ACCEPTED)


class OtpVerifyView(APIView):
    """Step 2 of email verification.

    Requires a code that was previously issued for THIS email. There is no
    fallback identity and no anonymous access is ever granted.
    """
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        otp = str(request.data.get('otp', '')).strip()
        email = request.data.get('email', '').strip().lower()

        if not email:
            return Response({'error': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if len(otp) != 6 or not otp.isdigit():
            return Response({'error': 'Invalid OTP code. Must be 6 digits.'},
                            status=status.HTTP_400_BAD_REQUEST)

        ok, reason = consume_otp(email, 'verify', otp)
        if not ok:
            message = {
                'invalid': 'Invalid OTP code.',
                'expired': 'OTP has expired. Please request a new code.',
                'too_many_attempts': 'Too many attempts. Please request a new code.',
            }.get(reason, 'Invalid OTP code.')
            return Response({'error': message}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'Account not found.'}, status=status.HTTP_404_NOT_FOUND)

        if not user.is_active:
            return Response({'error': 'Account is suspended'}, status=status.HTTP_403_FORBIDDEN)

        user.is_email_verified = True
        user.save(update_fields=['is_email_verified'])

        refresh = RefreshToken.for_user(user)
        return Response({
            'verified': True,
            'user': UserSerializer(user).data,
            'tokens': {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            }
        })


class ForgotPasswordView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        user = User.objects.filter(email=email).first()
        if user and user.is_active:
            issue_otp(email, 'password_reset')
        # Always the same response so accounts cannot be enumerated.
        return Response(
            {'message': 'If the account exists, a password reset code has been sent.'},
            status=status.HTTP_202_ACCEPTED,
        )


class PasswordResetConfirmView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        otp = str(request.data.get('otp', '')).strip()
        new_password = request.data.get('newPassword') or request.data.get('password') or ''

        if len(new_password) < 8:
            return Response({'newPassword': ['Password must be at least 8 characters.']},
                            status=status.HTTP_400_BAD_REQUEST)

        ok, reason = consume_otp(email, 'password_reset', otp)
        if not ok:
            return Response({'otp': ['Invalid or expired reset code.']}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(email=email).first()
        if not user:
            return Response({'error': 'Account not found.'}, status=status.HTTP_404_NOT_FOUND)

        user.set_password(new_password)
        user.save(update_fields=['password'])
        return Response({'message': 'Password updated. Please sign in.'})


class UserViewSet(viewsets.ModelViewSet):
    """Admin-only user management.

    Staff may read the student roster; only admins may create, modify or delete.
    """
    serializer_class = UserSerializer

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return AdminUserSerializer
        if self.request.user.is_authenticated and self.request.user.role == 'staff':
            return StaffUserSerializer
        return UserSerializer

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [IsAdminOrStaff()]
        return [IsAdmin()]

    def get_queryset(self):
        user = self.request.user
        if is_admin(user):
            qs = User.objects.all().order_by('-date_joined')
        elif user.role == 'staff':
            qs = User.objects.filter(role='student').order_by('-date_joined')
        else:
            return User.objects.none()

        role = self.request.query_params.get('role')
        if role:
            qs = qs.filter(role=role)
        search = self.request.query_params.get('search')
        if search:
            from django.db.models import Q
            s = search.strip()
            qs = qs.filter(
                Q(email__icontains=s) |
                Q(name__icontains=s) |
                Q(first_name__icontains=s) |
                Q(last_name__icontains=s)
            )
        return qs

    def perform_update(self, serializer):
        # An admin must not be able to strip their own admin role and lock
        # the platform out of its own management screens.
        if serializer.instance == self.request.user and serializer.validated_data.get('role') != 'admin':
            raise ValidationError({'role': 'You cannot change your own role.'})
        serializer.save()

    def perform_destroy(self, instance):
        if instance == self.request.user:
            raise ValidationError({'detail': 'You cannot delete your own account.'})
        instance.delete()


class CreateStaffView(APIView):
    permission_classes = (IsAdmin,)

    def post(self, request):
        serializer = CreateStaffSerializer(data=request.data)
        if serializer.is_valid():
            staff = serializer.save()
            return Response(UserSerializer(staff).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
