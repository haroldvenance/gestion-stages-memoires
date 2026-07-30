from rest_framework import viewsets, permissions

from .models import Entreprise
from .serializers import EntrepriseSerializer


class IsAdminOuLectureSeule(permissions.BasePermission):
    """Lecture ouverte à tout utilisateur authentifié, écriture réservée à
    l'administration (RG 3.4 : gestion de l'annuaire des partenaires)."""

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.role == 'admin' or request.user.is_superuser


class EntrepriseViewSet(viewsets.ModelViewSet):
    serializer_class = EntrepriseSerializer
    permission_classes = [IsAdminOuLectureSeule]
    queryset = Entreprise.objects.all()
    filterset_fields = ['ville', 'secteur_activite']
    search_fields = ['nom', 'ville']
