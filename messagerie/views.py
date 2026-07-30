from django.db import models
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Message
from .serializers import MessageSerializer


class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Message.objects.filter(
            models.Q(expediteur=user) | models.Q(destinataire=user)
        ).select_related('expediteur', 'destinataire', 'demande')
        demande_id = self.request.query_params.get('demande')
        if demande_id:
            qs = qs.filter(demande_id=demande_id)
        return qs

    def perform_create(self, serializer):
        serializer.save(expediteur=self.request.user)

    @action(detail=False, methods=['post'])
    def marquer_lus(self, request):
        """Marque comme lus tous les messages reçus pour un dossier donné."""
        demande_id = request.data.get('demande')
        qs = Message.objects.filter(destinataire=request.user, lu=False)
        if demande_id:
            qs = qs.filter(demande_id=demande_id)
        updated = qs.update(lu=True)
        return Response({'messages_marques_lus': updated})
