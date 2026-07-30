from rest_framework import permissions


class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (request.user.role == 'admin' or request.user.is_superuser)
        )


class IsAuthenticatedReadOnlyOrAdmin(permissions.BasePermission):
    """Lecture pour tout utilisateur connecté (ex: annuaire des encadreurs
    pour le formulaire de demande), écriture réservée à l'administration."""

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.role == 'admin' or request.user.is_superuser
