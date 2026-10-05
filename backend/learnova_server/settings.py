import os
from pathlib import Path
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent


def _split_env(value):
    return [item.strip() for item in (value or '').split(',') if item.strip()]


SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'learnova-secure-insecure-key-dev-prototype-2026')
DEBUG = os.environ.get('DEBUG', 'True') == 'True'

ALLOWED_HOSTS = _split_env(os.environ.get('ALLOWED_HOSTS', '*'))

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third party
    'corsheaders',
    'rest_framework',
    'rest_framework_simplejwt',
    
    # Internal apps
    'accounts',
    'courses',
    'enrollments',
    'payments',
    'notifications',
    'admin_ops',
    'core',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'learnova_server.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'learnova_server.wsgi.application'

# Database configuration: MongoDB, PostgreSQL, or SQLite
# MongoDB service connector uses MONGO_URI via core.mongodb (pymongo)
MONGO_URI = os.environ.get('MONGO_URI', 'mongodb://localhost:27017')
MONGO_DB_NAME = os.environ.get('MONGO_DB_NAME', 'learnova_db')

if os.environ.get('USE_MONGO_ENGINE') == 'true':
    DATABASES = {
        'default': {
            'ENGINE': 'django_mongodb_backend',
            'NAME': MONGO_DB_NAME,
            'HOST': MONGO_URI,
            'USER': os.environ.get('MONGO_USER', ''),
            'PASSWORD': os.environ.get('MONGO_PASSWORD', ''),
        }
    }
elif os.environ.get('DATABASE_URL'):
    try:
        import dj_database_url
        DATABASES = {
            'default': dj_database_url.config(
                conn_max_age=600,
                ssl_require=os.environ.get('DB_SSL_REQUIRE', '') == 'True',
            )
        }
    except ImportError:
        DATABASES = {
            'default': {
                'ENGINE': 'django.db.backends.sqlite3',
                'NAME': BASE_DIR / 'db.sqlite3',
            }
        }
elif os.environ.get('USE_POSTGRES') == 'true':
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.environ.get('DB_NAME', 'learnova'),
            'USER': os.environ.get('DB_USER', 'postgres'),
            'PASSWORD': os.environ.get('DB_PASSWORD', 'postgres'),
            'HOST': os.environ.get('DB_HOST', 'localhost'),
            'PORT': os.environ.get('DB_PORT', '5432'),
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

AUTH_USER_MODEL = 'accounts.User'

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', 'OPTIONS': {'min_length': 6}},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

if os.environ.get('USE_MONGO_ENGINE') == 'true':
    DEFAULT_AUTO_FIELD = 'django_mongodb_backend.fields.ObjectIdAutoField'
else:
    DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Serve admin/DRF static assets from the app process - Render gives no web server.
STORAGES = {
    'default': {'BACKEND': 'django.core.files.storage.FileSystemStorage'},
    'staticfiles': {'BACKEND': 'whitenoise.storage.CompressedManifestStaticFilesStorage'},
}

# CORS
# React Native sends no Origin header, so native clients are unaffected by this
# list - it exists for the React Native Web build and the Django admin site.
# Production must NOT use CORS_ALLOW_ALL_ORIGINS.
CORS_ALLOWED_ORIGINS = _split_env(os.environ.get(
    'CORS_ALLOWED_ORIGINS',
    'http://localhost:8000,http://127.0.0.1:8000,http://localhost:8081,http://127.0.0.1:8081',
))
# Opt-in only, and never alongside a production allow-list: with this True the
# origin list above is ignored entirely.
CORS_ALLOW_ALL_ORIGINS = DEBUG and os.environ.get('CORS_ALLOW_ALL_ORIGINS', '') == 'True'
CORS_ALLOW_CREDENTIALS = True

ALLOWED_HOSTS = _split_env(os.environ.get('ALLOWED_HOSTS', '*'))

# Media uploads (spec 20).
# MEDIA_ROOT is NOT served publicly - protected files are streamed only via the
# authenticated /api/v1/materials/{id}/stream/ endpoint.
MEDIA_URL = '/media/'
MEDIA_ROOT = Path(os.environ.get('MEDIA_ROOT', BASE_DIR / 'media'))

# Lifetime of the signed viewer token handed out by /materials/{id}/access/.
MATERIAL_VIEWER_TTL_SECONDS = int(os.environ.get('MATERIAL_VIEWER_TTL_SECONDS', '900'))

# Razorpay - the secret is server-side only and is never returned to a client.
RAZORPAY_KEY_ID = os.environ.get('RAZORPAY_KEY_ID', '')
RAZORPAY_KEY_SECRET = os.environ.get('RAZORPAY_KEY_SECRET', '')
# Overridable so the payment flow can be exercised against a local gateway stub.
RAZORPAY_API_BASE = os.environ.get('RAZORPAY_API_BASE', 'https://api.razorpay.com/v1')

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
}

# SimpleJWT - access tokens are deliberately short-lived; the mobile client
# refreshes silently via its 401 interceptor.
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=int(os.environ.get('JWT_ACCESS_MINUTES', '60'))),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=int(os.environ.get('JWT_REFRESH_DAYS', '30'))),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': False,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# Production transport hardening. Off in development so plain-HTTP local testing
# still works.
if not DEBUG:
    SECURE_SSL_REDIRECT = os.environ.get('SECURE_SSL_REDIRECT', 'True') == 'True'
    SECURE_HSTS_SECONDS = int(os.environ.get('SECURE_HSTS_SECONDS', '31536000'))
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    CSRF_TRUSTED_ORIGINS = _split_env(os.environ.get('CSRF_TRUSTED_ORIGINS', ''))
    X_FRAME_OPTIONS = 'DENY'
    SECURE_CONTENT_TYPE_NOSNIFF = True
