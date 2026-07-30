from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from accounts.views import MeView

from demandes.views import DemandeViewSet, DocumentViewSet
from messagerie.views import MessageViewSet
from soutenances.views import PropositionCreneauViewSet, SoutenanceViewSet, JuryViewSet

router = DefaultRouter()
router.register(r'demandes', DemandeViewSet, basename='demande')
router.register(r'documents', DocumentViewSet, basename='document')
router.register(r'messages', MessageViewSet, basename='message')
router.register(r'propositions', PropositionCreneauViewSet, basename='proposition')
router.register(r'soutenances', SoutenanceViewSet, basename='soutenance')
router.register(r'jury', JuryViewSet, basename='jury')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/auth/me/', MeView.as_view(), name='me'),
]



