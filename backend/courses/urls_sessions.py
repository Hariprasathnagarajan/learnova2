from django.urls import path
from .views import SessionJoinView, SessionAdminDetailView

urlpatterns = [
    path('<int:session_id>/join/', SessionJoinView.as_view(), name='session_join'),
    path('<int:session_id>/admin/', SessionAdminDetailView.as_view(), name='session_admin_detail'),
]

