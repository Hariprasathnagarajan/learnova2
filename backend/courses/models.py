from django.db import models
from django.conf import settings


class Course(models.Model):
    LEVEL_CHOICES = (
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
    )

    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True)
    description = models.TextField()
    category = models.CharField(max_length=100)
    level = models.CharField(max_length=20, choices=LEVEL_CHOICES, default='beginner')
    instructor_name = models.CharField(max_length=150)
    instructor_avatar = models.CharField(max_length=500, blank=True, null=True)
    thumbnail_url = models.CharField(max_length=500, blank=True, null=True)
    price_inr = models.PositiveIntegerField(default=0)
    rating = models.FloatField(default=4.8)
    total_reviews = models.PositiveIntegerField(default=0)
    total_enrolled = models.PositiveIntegerField(default=0)
    duration_hours = models.PositiveIntegerField(default=10)
    total_sessions = models.PositiveIntegerField(default=5)
    tags = models.JSONField(default=list, blank=True)
    is_published = models.BooleanField(default=True)
    assigned_staff = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='assigned_courses',
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title


class PaymentPlan(models.Model):
    DURATION_CHOICES = (
        (1, '1 Month'),
        (3, '3 Months'),
        (6, '6 Months'),
        (12, '12 Months'),
        (24, '24 Months'),
    )
    PLAN_TYPE_CHOICES = (
        ('full', 'Full Payment'),
        ('installment', 'Installment Plan'),
        ('emi', 'EMI Plan'),
    )

    course = models.ForeignKey(Course, related_name='payment_plans', on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    description = models.CharField(max_length=255)
    price_inr = models.PositiveIntegerField()
    currency = models.CharField(max_length=10, default='INR')
    plan_type = models.CharField(max_length=20, choices=PLAN_TYPE_CHOICES, default='full')
    duration_months = models.PositiveSmallIntegerField(choices=DURATION_CHOICES, default=3)
    installments = models.PositiveSmallIntegerField(default=1)
    installment_amount_inr = models.PositiveIntegerField(null=True, blank=True)
    is_popular = models.BooleanField(default=False)
    features = models.JSONField(default=list, blank=True)

    def __str__(self):
        return f"{self.course.title} - {self.name}"

class Session(models.Model):
    PLATFORM_CHOICES = (
        ('zoom', 'Zoom'),
        ('meet', 'Google Meet'),
        ('internal', 'Learnova Live Room'),
    )
    STATUS_CHOICES = (
        ('scheduled', 'Scheduled'),
        ('live', 'Live Now'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    )

    course = models.ForeignKey(Course, related_name='sessions', on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    instructor_name = models.CharField(max_length=150)
    start_time = models.DateTimeField()
    duration_minutes = models.PositiveIntegerField(default=60)
    platform = models.CharField(max_length=20, choices=PLATFORM_CHOICES, default='zoom')
    meeting_id = models.CharField(max_length=100, blank=True)
    passcode = models.CharField(max_length=100, blank=True)
    meeting_url = models.CharField(max_length=500, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')

    def __str__(self):
        return f"{self.title} ({self.status})"

class Material(models.Model):
    TYPE_CHOICES = (
        ('pdf', 'PDF Document'),
        ('image', 'Image'),
        ('video', 'Video Lecture'),
        ('slides', 'Presentation Slides'),
        ('link', 'External Resource'),
    )

    course = models.ForeignKey(Course, related_name='materials', on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='pdf')
    file = models.FileField(upload_to='materials/%Y/%m/', blank=True, null=True)
    file_size_bytes = models.BigIntegerField(default=0)
    file_url = models.CharField(max_length=500, blank=True)
    is_protected = models.BooleanField(default=True)
    allow_download = models.BooleanField(default=False)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='uploaded_materials',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def source(self):
        """Uploaded file takes precedence over an external link."""
        if self.file:
            return self.file.url
        return self.file_url or ''

    def __str__(self):
        return self.title


class Note(models.Model):
    course = models.ForeignKey(Course, related_name='notes', on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    content = models.TextField()
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='authored_notes',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    attachment_url = models.CharField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title
