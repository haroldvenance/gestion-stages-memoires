from django.db import models
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from django.shortcuts import get_object_or_404
from .models import Demande, Document
from .serializers import DemandeSerializer, DocumentSerializer
from .permissions import IsEtudiant, IsEncadreur, IsAdmin, IsProprietaireDemande, IsEncadreurDeLaDemande

class DemandeViewSet(viewsets.ModelViewSet):
    serializer_class = DemandeSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Demande.objects.all()
        elif user.role == 'encadreur':
            enc = user.profil_encadreur
            return Demande.objects.filter(
                models.Q(encadreur_souhaite=enc) | models.Q(encadreur_effectif=enc)
            )
        else:
            return Demande.objects.filter(etudiant=user.profil_etudiant)

    def get_permissions(self):
        if self.action == 'create':
            self.permission_classes = [IsEtudiant]
        elif self.action in ['update', 'partial_update', 'destroy']:
            self.permission_classes = [IsProprietaireDemande | IsEncadreurDeLaDemande | IsAdmin]
        else:
            self.permission_classes = [IsEtudiant | IsEncadreur | IsAdmin]
        return super().get_permissions()

    @action(detail=True, methods=['post'], permission_classes=[IsEncadreurDeLaDemande])
    def accepter(self, request, pk=None):
        demande = self.get_object()
        demande.statut = 'acceptee'
        demande.encadreur_effectif = request.user.profil_encadreur
        demande.date_reponse = timezone.now()
        demande.save()
        return Response({'status': 'acceptee'})

    @action(detail=True, methods=['post'], permission_classes=[IsEncadreurDeLaDemande])
    def refuser(self, request, pk=None):
        demande = self.get_object()
        demande.statut = 'refusee'
        demande.date_reponse = timezone.now()
        demande.commentaire_encadreur = request.data.get('commentaire', '')
        demande.save()
        return Response({'status': 'refusee'})


class DocumentViewSet(viewsets.ModelViewSet):
    serializer_class = DocumentSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Document.objects.all()
        elif user.role == 'encadreur':
            enc = user.profil_encadreur
            return Document.objects.filter(demande__encadreur_effectif=enc)
        else:
            return Document.objects.filter(demande__etudiant=user.profil_etudiant)

    def perform_create(self, serializer):
        demande_id = self.request.data.get('demande')
        demande = get_object_or_404(Demande, id=demande_id)
        if self.request.user.role != 'admin' and demande.etudiant.user != self.request.user:
            raise PermissionDenied("Vous n'êtes pas autorisé à ajouter un document à cette demande.")
        last_version = Document.objects.filter(demande=demande).order_by('-version').first()
        version = (last_version.version + 1) if last_version else 1
        serializer.save(demande=demande, version=version)