import logging

security_logger = logging.getLogger('audit')

# Méthodes considérées comme "sensibles" : toute écriture, ou toute lecture
# d'une ressource marquée comme surveillée via SENSITIVE_PATH_PREFIXES.
WRITE_METHODS = {'POST', 'PUT', 'PATCH', 'DELETE'}

SENSITIVE_PATH_PREFIXES = (
    '/api/auth/',
    '/api/demandes/',
    '/api/soutenances/',
    '/api/jury/',
    '/api/statistiques/',
)


def _client_ip(request):
    forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    if forwarded:
        return forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


class AuditLogMiddleware:
    """Journalise les requêtes sensibles (écriture, authentification) et les
    réponses en erreur (401/403) qui traduisent des tentatives d'accès non
    autorisées, conformément à l'exigence de traçabilité du cahier des charges.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        try:
            self._log_if_relevant(request, response)
        except Exception:
            # Le journal d'audit ne doit jamais interrompre une requête métier.
            security_logger.exception("Echec de journalisation d'audit")
        return response

    def _log_if_relevant(self, request, response):
        path = request.path
        is_sensitive_path = any(path.startswith(p) for p in SENSITIVE_PATH_PREFIXES)
        is_write = request.method in WRITE_METHODS
        is_denied = response.status_code in (401, 403)

        should_log = is_denied or (is_sensitive_path and is_write)
        if not should_log:
            return

        # Import différé pour éviter les soucis de chargement d'apps.
        from .models import AuditLog

        user = getattr(request, 'user', None)
        user = user if user and getattr(user, 'is_authenticated', False) else None
        niveau = 'security' if is_denied else 'info'

        AuditLog.objects.create(
            utilisateur=user,
            role_utilisateur=getattr(user, 'role', '') if user else '',
            action=f"{request.method} {path}",
            methode=request.method,
            chemin=path,
            statut_code=response.status_code,
            adresse_ip=_client_ip(request),
            niveau=niveau,
            details='Accès refusé' if is_denied else '',
        )

        if is_denied:
            security_logger.warning(
                "Accès refusé (%s) sur %s par %s depuis %s",
                response.status_code, path,
                user.username if user else 'anonyme',
                _client_ip(request),
            )
