from django.urls import path
from .views import UserViewSet, CreateStaffView

user_list = UserViewSet.as_view({'get': 'list', 'post': 'create'})
user_detail = UserViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'})

urlpatterns = [
    path('', user_list, name='user_list'),
    path('<int:pk>/', user_detail, name='user_detail'),
    path('create-staff/', CreateStaffView.as_view(), name='create_staff'),
]
