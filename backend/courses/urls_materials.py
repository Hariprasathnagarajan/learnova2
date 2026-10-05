from django.urls import path
from .views import MaterialAccessView, MaterialDetailView, MaterialStreamView

urlpatterns = [
    path('<int:pk>/', MaterialDetailView.as_view(), name='material_detail'),
    path('<int:material_id>/access/', MaterialAccessView.as_view(), name='material_access'),
    path('<int:material_id>/stream/', MaterialStreamView.as_view(), name='material_stream'),
]