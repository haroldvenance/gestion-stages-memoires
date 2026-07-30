from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import PropositionCreneau, Soutenance, Jury
from .serializers import PropositionCreneauSerializer, SoutenanceSerializer, JurySerializer
from demandes.permissions import IsEncadreur, IsAdmin

class PropositionCreneauViewSet(viewsets.ModelViewSet):
    serializer_class = PropositionCreneauSerializer
    permission_classes = [IsEncadreur | IsAdmin]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return PropositionCreneau.objects.all()
        return PropositionCreneau.objects.filter(encadreur=user.profil_encadreur)


class SoutenanceViewSet(viewsets.ModelViewSet):
    serializer_class = SoutenanceSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        return Soutenance.objects.all()

    @action(detail=True, methods=['post'])
    def generer_pv(self, request, pk=None):
        soutenance = self.get_object()
        # À implémenter avec reportlab / weasyprint
        soutenance.pv_url = f"/pv/soutenance_{soutenance.id}.pdf"
        soutenance.save()
        return Response({'pv_url': soutenance.pv_url})


class JuryViewSet(viewsets.ModelViewSet):
    serializer_class = JurySerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        return Jury.objects.all()