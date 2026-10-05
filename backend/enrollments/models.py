from django.db import models
from django.conf import settings
from courses.models import Course, PaymentPlan


class Enrollment(models.Model):
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('paused', 'Paused'),
        ('cancelled', 'Cancelled'),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='enrollments', on_delete=models.CASCADE)
    course = models.ForeignKey(Course, related_name='enrollments', on_delete=models.CASCADE)
    payment_plan = models.ForeignKey(PaymentPlan, null=True, blank=True, on_delete=models.SET_NULL)
    payment = models.ForeignKey(
        'payments.Payment',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='enrollments',
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    progress_percentage = models.PositiveSmallIntegerField(default=0)
    expires_at = models.DateTimeField(null=True, blank=True)
    enrolled_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('user', 'course')
        indexes = [models.Index(fields=['user', 'status'])]

    def __str__(self):
        return f"{self.user.email} - {self.course.title} ({self.status})"

    @property
    def access_status(self):
        from core.access import compute_access_status
        return compute_access_status(self)