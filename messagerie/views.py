from rest_framework import viewsets
from django.db import models
from .models import Message
from .serializers import MessageSerializer

class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer

    def get_queryset(self):
        user = self.request.user
        return Message.objects.filter(
            models.Q(expediteur=user) | models.Q(destinataire=user)
        )

    def perform_create(self, serializer):
        serializer.save(expediteur=self.request.user)