from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from accounts.views import (
    ChangePasswordView, EncadreurViewSet, MeView, UtilisateurAdminViewSet,
)
from audit.views import AuditLogViewSet
from demandes.views import DemandeViewSet, DocumentViewSet
from entreprises.views import EntrepriseViewSet
from messagerie.views import MessageViewSet
from soutenances.views import PropositionCreneauViewSet, SoutenanceViewSet, JuryViewSet
from statistiques.views import DashboardView, ExportDemandesView, QuotaConsoleView

from .auth_views import ThrottledTokenObtainPairView

router = DefaultRouter()
router.register(r'demandes', DemandeViewSet, basename='demande')
router.register(r'documents', DocumentViewSet, basename='document')
router.register(r'messages', MessageViewSet, basename='message')
router.register(r'propositions', PropositionCreneauViewSet, basename='proposition')
router.register(r'soutenances', SoutenanceViewSet, basename='soutenance')
router.register(r'jury', JuryViewSet, basename='jury')
router.register(r'encadreurs', EncadreurViewSet, basename='encadreur')
router.register(r'utilisateurs', UtilisateurAdminViewSet, basename='utilisateur')
router.register(r'entreprises', EntrepriseViewSet, basename='entreprise')
router.register(r'audit-logs', AuditLogViewSet, basename='audit-log')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),

    # Authentification
    path('api/auth/login/', ThrottledTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/me/', MeView.as_view(), name='me'),
    path('api/auth/changer-mot-de-passe/', ChangePasswordView.as_view(), name='change_password'),

    # Statistiques et exports (administration)
    path('api/statistiques/dashboard/', DashboardView.as_view(), name='stats-dashboard'),
    path('api/statistiques/quotas/', QuotaConsoleView.as_view(), name='stats-quotas'),
    path('api/statistiques/export/demandes/', ExportDemandesView.as_view(), name='stats-export-demandes'),

    # Documentation API
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
