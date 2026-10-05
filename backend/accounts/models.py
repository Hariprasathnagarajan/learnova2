from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils import timezone
import hashlib
import secrets

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, username=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'admin')
        return self.create_user(email, password, **extra_fields)

class User(AbstractUser):
    ROLE_CHOICES = (
        ('student', 'Student'),
        ('staff', 'Faculty / Staff'),
        ('admin', 'Administrator'),
    )

    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='student')
    phone = models.CharField(max_length=20, blank=True, null=True)
    avatar_url = models.CharField(max_length=500, blank=True, null=True)
    name = models.CharField(max_length=150, blank=True)
    is_email_verified = models.BooleanField(default=False)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    def save(self, *args, **kwargs):
        if not self.username:
            self.username = self.email
        if not self.name and (self.first_name or self.last_name):
            self.name = f"{self.first_name} {self.last_name}".strip()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.email} ({self.role})"


class OTPChallenge(models.Model):
    """One-time codes.

    Stored in the database rather than process memory so verification works
    across gunicorn workers and survives a restart. Only a salted hash of the
    code is persisted.
    """

    PURPOSE_CHOICES = (
        ('verify', 'Email Verification'),
        ('password_reset', 'Password Reset'),
    )

    email = models.EmailField()
    purpose = models.CharField(max_length=20, choices=PURPOSE_CHOICES)
    code_hash = models.CharField(max_length=128)
    salt = models.CharField(max_length=64)
    attempts = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    consumed_at = models.DateTimeField(null=True, blank=True)

    OTP_TTL_MINUTES = 5
    MAX_ATTEMPTS = 5

    class Meta:
        indexes = [models.Index(fields=['email', 'purpose'])]

    @classmethod
    def issue(cls, email, purpose, ttl_minutes=None):
        from datetime import timedelta
        salt = secrets.token_hex(16)
        code = f'{secrets.randbelow(1000000):06d}'
        cls.objects.filter(email=email, purpose=purpose, consumed_at__isnull=True).delete()
        return cls.objects.create(
            email=email,
            purpose=purpose,
            code_hash=cls._hash(code, salt),
            salt=salt,
            expires_at=timezone.now() + timedelta(minutes=ttl_minutes or cls.OTP_TTL_MINUTES),
        ), code

    @staticmethod
    def _hash(code, salt):
        return hashlib.sha256(f'{salt}:{code}'.encode('utf-8')).hexdigest()

    @classmethod
    def verify(cls, email, purpose, submitted):
        """Returns (ok, reason). Burns the challenge on success or exhaustion."""
        challenge = (
            cls.objects
            .filter(email=email, purpose=purpose, consumed_at__isnull=True)
            .order_by('-created_at')
            .first()
        )
        if not challenge:
            return False, 'expired'
        if challenge.expires_at <= timezone.now():
            challenge.delete()
            return False, 'expired'
        if challenge.attempts >= cls.MAX_ATTEMPTS:
            challenge.delete()
            return False, 'too_many_attempts'

        candidate = cls._hash(str(submitted or ''), challenge.salt)
        if not secrets.compare_digest(candidate, challenge.code_hash):
            challenge.attempts += 1
            if challenge.attempts >= cls.MAX_ATTEMPTS:
                challenge.delete()
                return False, 'too_many_attempts'
            challenge.save(update_fields=['attempts'])
            return False, 'invalid'

        challenge.consumed_at = timezone.now()
        challenge.save(update_fields=['consumed_at'])
        return True, ''

    def __str__(self):
        return f"{self.email} {self.purpose} ({self.expires_at:%H:%M:%S})"
