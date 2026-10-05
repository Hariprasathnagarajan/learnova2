from django.urls import path
from .views import (
    CourseViewSet, CourseDetailProtectedView, CourseAccessView,
    CourseSessionsListView, CourseMaterialsListView, CourseNotesListView,
    CoursePaymentPlansView,
    CourseSessionWriteView, CourseMaterialWriteView,
    CourseNoteWriteView, CoursePaymentPlanWriteView,
)

course_list = CourseViewSet.as_view({'get': 'list', 'post': 'create'})
course_detail = CourseViewSet.as_view({
    'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy',
})

urlpatterns = [
    path('', course_list, name='course_list'),
    path('<int:pk>/', course_detail, name='course_detail'),
    path('<int:pk>/detail/', CourseDetailProtectedView.as_view(), name='course_detail_protected'),
    path('<int:pk>/access/', CourseAccessView.as_view(), name='course_access'),

    path('<int:course_id>/sessions/', CourseSessionsListView.as_view(), name='course_sessions'),
    path('<int:course_id>/sessions/write/', CourseSessionWriteView.as_view(), name='course_session_write'),
    path('<int:course_id>/sessions/<int:session_id>/', CourseSessionWriteView.as_view(),
         name='course_session_update'),

    path('<int:course_id>/materials/', CourseMaterialsListView.as_view(), name='course_materials'),
    path('<int:course_id>/materials/write/', CourseMaterialWriteView.as_view(), name='course_material_write'),
    path('<int:course_id>/materials/<int:material_id>/', CourseMaterialWriteView.as_view(),
         name='course_material_update'),

    path('<int:course_id>/notes/', CourseNotesListView.as_view(), name='course_notes'),
    path('<int:course_id>/notes/write/', CourseNoteWriteView.as_view(), name='course_note_write'),
    path('<int:course_id>/notes/<int:note_id>/', CourseNoteWriteView.as_view(),
         name='course_note_update'),

    path('<int:course_id>/payment-plans/', CoursePaymentPlansView.as_view(), name='course_payment_plans'),
    path('<int:course_id>/payment-plans/write/', CoursePaymentPlanWriteView.as_view(),
         name='course_payment_plan_write'),
    path('<int:course_id>/payment-plans/<int:plan_id>/', CoursePaymentPlanWriteView.as_view(),
         name='course_payment_plan_update'),
]