import logging

from rest_framework.throttling import ScopedRateThrottle
from rest_framework_simplejwt.views import TokenObtainPairView

security_logger = logging.getLogger('audit')


class LoginRateThrottle(ScopedRateThrottle):
    scope = 'login'


class ThrottledTokenObtainPairView(TokenObtainPairView):
    """Point d'entrée /api/auth/login/ avec limitation de débit (RG sécurité :
    protection contre le bruteforce, cf. registre des risques R2)."""

    throttle_classes = [LoginRateThrottle]

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        username = request.data.get('username', '')
        if response.status_code == 200:
            security_logger.info("Connexion réussie pour %s", username)
        else:
            security_logger.warning(
                "Echec de connexion pour %s depuis %s",
                username, request.META.get('REMOTE_ADDR'),
            )
        return response
