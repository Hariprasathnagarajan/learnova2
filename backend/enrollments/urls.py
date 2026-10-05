from django.urls import path
from .views import (
    EnrollmentViewSet, MyEnrollmentsView, EnrollmentAccessView,
    EnrollmentGrantView, EnrollmentManageView,
)

enrollment_list = EnrollmentViewSet.as_view({'get': 'list', 'post': 'create'})
enrollment_detail = EnrollmentViewSet.as_view({
    'get': 'retrieve', 'delete': 'destroy', 'patch': 'partial_update',
})

urlpatterns = [
    path('', enrollment_list, name='enrollment_list'),
    path('my-courses/', MyEnrollmentsView.as_view(), name='my_courses'),
    path('grant/', EnrollmentGrantView.as_view(), name='enrollment_grant'),
    path('<int:pk>/', enrollment_detail, name='enrollment_detail'),
    path('<int:pk>/access/', EnrollmentAccessView.as_view(), name='enrollment_access'),
    path('<int:pk>/manage/', EnrollmentManageView.as_view(), name='enrollment_manage'),
]