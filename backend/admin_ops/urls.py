from django.urls import path
from .views import (
    AdminDashboardView, StaffDashboardView,
    NotificationCreateView, AdminUserCourseAssignmentView,
)

urlpatterns = [
    path('dashboard/', AdminDashboardView.as_view(), name='admin_dashboard'),
    path('staff-dashboard/', StaffDashboardView.as_view(), name='staff_dashboard'),
    path('notifications/', NotificationCreateView.as_view(), name='admin_notification_create'),
    path('courses/<int:pk>/assign-staff/', AdminUserCourseAssignmentView.as_view(),
         name='admin_course_assign_staff'),
]