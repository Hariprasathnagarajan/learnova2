from django.urls import path
from .views import NotificationListView, MarkNotificationReadView, MarkAllReadView

urlpatterns = [
    path('', NotificationListView.as_view(), name='notification_list'),
    path('<int:notification_id>/read/', MarkNotificationReadView.as_view(), name='mark_read'),
    path('read-all/', MarkAllReadView.as_view(), name='mark_all_read'),
]
