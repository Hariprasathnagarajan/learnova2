from django.db import models
from django.conf import settings

class Notification(models.Model):
    TYPE_CHOICES = (
        ('session_reminder', 'Session Reminder'),
        ('payment_success', 'Payment Success'),
        ('payment_due', 'Payment Due'),
        ('material_added', 'Material Added'),
        ('note_added', 'New Note'),
        ('enrollment', 'Enrollment Update'),
        ('course_expiry', 'Course Expiry'),
        ('announcement', 'Announcement'),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='notifications', on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    message = models.TextField()
    type = models.CharField(max_length=30, choices=TYPE_CHOICES, default='announcement')
    is_read = models.BooleanField(default=False)
    course_id = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.email} - {self.title}"
