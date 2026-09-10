"""
Django settings for backend project.

Configuration adaptée pour :
- Développement local : SQLite
- Production : Render (Web Service) + PostgreSQL (Render) + Vercel (Frontend)
"""

import os
from datetime import timedelta
import dj_database_url
from pathlib import Path
from dotenv import load_dotenv

# Charge le fichier .env en local (ignoré en production sur Render)
load_dotenv()

# ------------------------------------------------------------------------------
# CHEMINS DE BASE
# ------------------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent.parent

# ------------------------------------------------------------------------------
# SÉCURITÉ
# ------------------------------------------------------------------------------
SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', 'django-insecure-default-key-change-me')
DEBUG = os.getenv('DJANGO_DEBUG', 'False').lower() in ('true', '1', 'yes')

ALLOWED_HOSTS = [
    h.strip() for h in os.getenv(
        'DJANGO_ALLOWED_HOSTS',
        'localhost,127.0.0.1'
    ).split(',') if h.strip()
]

# ------------------------------------------------------------------------------
# APPLICATIONS
# ------------------------------------------------------------------------------
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'whitenoise.runserver_nostatic',  # Gestion des fichiers statiques
    'django.contrib.staticfiles',
    # Tiers
    'rest_framework',
    'rest_framework_simplejwt',
    'drf_spectacular',
    'corsheaders',
    # Nos applications
    'accounts',
    'audit',
    'demandes',
    'entreprises',
    'messagerie',
    'soutenances',
    'statistiques',
]

# ------------------------------------------------------------------------------
# MIDDLEWARE
# ------------------------------------------------------------------------------
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

ROOT_URLCONF = 'backend.urls'

# ------------------------------------------------------------------------------
# TEMPLATES
# ------------------------------------------------------------------------------
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'backend.wsgi.application'

# ------------------------------------------------------------------------------
# BASE DE DONNÉES
# - En local : SQLite (si DATABASE_URL absent)
# - En production (Render) : PostgreSQL via DATABASE_URL (Internal Database URL)
# ------------------------------------------------------------------------------
DATABASE_URL = os.getenv('DATABASE_URL')

if DATABASE_URL:
    # Production : PostgreSQL avec SSL obligatoire
    DATABASES = {
        'default': dj_database_url.config(
            default=DATABASE_URL,
            conn_max_age=600,
            conn_health_checks=True,
            ssl_require=True,
        )
    }
else:
    # Développement local : SQLite (pas de SSL)
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# ------------------------------------------------------------------------------
# VALIDATION DES MOTS DE PASSE
# ------------------------------------------------------------------------------
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ------------------------------------------------------------------------------
# INTERNATIONALISATION
# ------------------------------------------------------------------------------
LANGUAGE_CODE = 'fr-fr'
TIME_ZONE = 'Africa/Douala'
USE_I18N = True
USE_TZ = True

# ------------------------------------------------------------------------------
# FICHIERS STATIQUES & MÉDIAS
# ------------------------------------------------------------------------------
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ------------------------------------------------------------------------------
# CORS (autorise le frontend Vercel à appeler l'API Render)
# ------------------------------------------------------------------------------
if DEBUG:
    # En développement : tout est autorisé
    CORS_ALLOW_ALL_ORIGINS = True
else:
    # En production : liste blanche explicite
    CORS_ALLOWED_ORIGINS = [
        origin.strip()
        for origin in os.getenv('CORS_ALLOWED_ORIGINS', '').split(',')
        if origin.strip()
    ]

    # 🔥 Regex pour accepter AUTOMATIQUEMENT toutes les URLs Vercel du projet
    # (utile car les URLs de preview changent à chaque déploiement)
    CORS_ALLOWED_ORIGIN_REGEXES = [
        r"^https://gestion-stages-memoires.*\.vercel\.app$",
    ]

    CORS_ALLOW_CREDENTIALS = True

# ------------------------------------------------------------------------------
# CSRF (obligatoire depuis Django 4+ pour les POST depuis Vercel)
# ⚠️ Django n'accepte PAS les regex pour CSRF : il faut lister les URLs une à une
# ------------------------------------------------------------------------------
CSRF_TRUSTED_ORIGINS = [
    origin.strip()
    for origin in os.getenv('CSRF_TRUSTED_ORIGINS', '').split(',')
    if origin.strip()
]

# ------------------------------------------------------------------------------
# REST FRAMEWORK
# ------------------------------------------------------------------------------
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

# ------------------------------------------------------------------------------
# JWT
# ------------------------------------------------------------------------------
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
}

# ------------------------------------------------------------------------------
# SPECTACULAR (documentation API)
# ------------------------------------------------------------------------------
SPECTACULAR_SETTINGS = {
    'TITLE': 'API Gestion Stages & Mémoires',
    'DESCRIPTION': 'Plateforme de gestion des stages et mémoires académiques',
    'VERSION': '1.0.0',
}

# ------------------------------------------------------------------------------
# MODÈLE UTILISATEUR PERSONNALISÉ
# ------------------------------------------------------------------------------
AUTH_USER_MODEL = 'accounts.Utilisateur'

# ------------------------------------------------------------------------------
# SÉCURITÉ EN PRODUCTION (HTTPS, cookies sécurisés, HSTS)
# ------------------------------------------------------------------------------
if not DEBUG:
    # Render agit comme proxy HTTPS devant Gunicorn
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 31536000  # 1 an
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True