import os
from pathlib import Path
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.http import HttpResponse, FileResponse, Http404
from django.views.static import serve

from core.views import HealthView

FRONTEND_DIST = settings.BASE_DIR.parent / 'dist'
APK_PATH = settings.BASE_DIR.parent / 'android' / 'app' / 'build' / 'outputs' / 'apk' / 'debug' / 'app-debug.apk'

def download_apk_view(request):
    if APK_PATH.exists():
        response = FileResponse(open(APK_PATH, 'rb'), content_type='application/vnd.android.package-archive')
        response['Content-Disposition'] = 'attachment; filename="learnova-app.apk"'
        return response
    raise Http404("APK not found.")

def spa_web_view(request, *args, **kwargs):
    req_path = request.path.lstrip('/')
    if req_path:
        target_file = FRONTEND_DIST / req_path
        if target_file.exists() and target_file.is_file():
            return serve(request, req_path, document_root=str(FRONTEND_DIST))
    index_html = FRONTEND_DIST / 'index.html'
    if index_html.exists():
        with open(index_html, 'r', encoding='utf-8') as f:
            return HttpResponse(f.read(), content_type='text/html')
    return HttpResponse('Learnova API Server active.', content_type='text/plain')

from core.mongodb import check_mongo_connection
from django.http import JsonResponse

def mongodb_health_view(request):
    data = check_mongo_connection()
    status_code = 200 if data.get('connected') else 503
    return JsonResponse(data, status=status_code)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('download/app-debug.apk', download_apk_view),
    path('download/learnova.apk', download_apk_view),
    path('api/v1/health/', HealthView.as_view(), name='health'),
    path('api/v1/health/mongodb/', mongodb_health_view, name='health_mongodb'),
    path('api/v1/auth/', include('accounts.urls_auth')),
    path('api/v1/users/', include('accounts.urls_users')),
    path('api/v1/courses/', include('courses.urls_courses')),
    path('api/v1/sessions/', include('courses.urls_sessions')),
    path('api/v1/materials/', include('courses.urls_materials')),
    path('api/v1/enrollments/', include('enrollments.urls')),
    path('api/v1/payments/', include('payments.urls')),
    path('api/v1/notifications/', include('notifications.urls')),
    path('api/v1/admin/', include('admin_ops.urls')),
    
    # NOTE: MEDIA_ROOT is deliberately NOT exposed as a public route.
    # Protected learning material must only ever be streamed through
    # /api/v1/materials/{id}/stream/, which verifies a short-lived viewer
    # token and re-checks enrolment on every request.

    # Static web bundle assets
    re_path(r'^assets/(?P<path>.*)$', serve, {'document_root': str(FRONTEND_DIST / 'assets')}),
    re_path(r'^_expo/(?P<path>.*)$', serve, {'document_root': str(FRONTEND_DIST / '_expo')}),
    re_path(r'^favicon\.ico$', serve, {'document_root': str(FRONTEND_DIST), 'path': 'favicon.ico'}),
    
    # SPA route fallback for all web URLs (/(student)/..., /(admin)/..., /(auth)/...)
    re_path(r'^(?!api/|admin/).*$', spa_web_view),
]

