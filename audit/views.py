from rest_framework import viewsets, permissions

from .models import AuditLog
from .serializers import AuditLogSerializer


class IsAdminRole(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (request.user.role == 'admin' or request.user.is_superuser)
        )


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """Consultation des logs d'audit — réservée à l'administration/administrateur
    système (RG "Consulter les logs" / "Traçabilité des actions")."""

    serializer_class = AuditLogSerializer
    permission_classes = [IsAdminRole]
    queryset = AuditLog.objects.select_related('utilisateur').all()
    filterset_fields = ['niveau', 'role_utilisateur', 'methode', 'statut_code']
