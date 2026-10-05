from django.db import models
from django.conf import settings
from courses.models import Course, PaymentPlan

class Payment(models.Model):
    STATUS_CHOICES = (
        ('created', 'Created'),
        ('successful', 'Successful'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    )

    order_id = models.CharField(max_length=100, unique=True)
    payment_id = models.CharField(max_length=100, blank=True, null=True)
    signature = models.CharField(max_length=255, blank=True, null=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='payments', on_delete=models.CASCADE)
    course = models.ForeignKey(Course, related_name='payments', on_delete=models.CASCADE)
    payment_plan = models.ForeignKey(PaymentPlan, null=True, blank=True, on_delete=models.SET_NULL)
    amount_inr = models.PositiveIntegerField()
    currency = models.CharField(max_length=10, default='INR')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='created')
    method = models.CharField(max_length=50, default='upi')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.order_id} - ₹{self.amount_inr} ({self.status})"
