import logging

from django.db import models
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from django.shortcuts import get_object_or_404

from accounts.permissions import IsAdmin as IsAdminRole
from .models import Demande, Document
from .serializers import (
    DemandeSerializer,
    DemandeReaffectationSerializer,
    DemandeRefusSerializer,
    DocumentSerializer,
)
from .permissions import IsEtudiant, IsEncadreur, IsAdmin, IsProprietaireDemande, IsEncadreurDeLaDemande, IsEncadreurDuDocument

security_logger = logging.getLogger('audit')


class DemandeViewSet(viewsets.ModelViewSet):
    serializer_class = DemandeSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            qs = Demande.objects.all()
        elif user.role == 'encadreur':
            enc = user.profil_encadreur
            qs = Demande.objects.filter(
                models.Q(encadreur_souhaite=enc) | models.Q(encadreur_effectif=enc)
            )
        else:
            qs = Demande.objects.filter(etudiant=user.profil_etudiant)
        return qs.select_related('etudiant__user', 'encadreur_souhaite__user', 'encadreur_effectif__user')

    def get_permissions(self):
        if self.action == 'create':
            self.permission_classes = [IsEtudiant]
        elif self.action in ['update', 'partial_update', 'destroy']:
            self.permission_classes = [IsProprietaireDemande | IsEncadreurDeLaDemande | IsAdmin]
        elif self.action in ['accepter', 'refuser', 'valider_finale']:
            self.permission_classes = [IsEncadreurDeLaDemande]
        elif self.action == 'reaffecter':
            self.permission_classes = [IsAdmin]
        else:
            self.permission_classes = [IsEtudiant | IsEncadreur | IsAdmin]
        return super().get_permissions()

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == 'etudiant':
            serializer.save(etudiant=user.profil_etudiant)
        else:
            serializer.save()

    @action(detail=True, methods=['post'])
    def accepter(self, request, pk=None):
        demande = self.get_object()
        encadreur = request.user.profil_encadreur

        # RG "Blocage automatique" : un encadreur saturé ne peut plus accepter de nouvelle demande
        if encadreur.est_sature:
            return Response(
                {'detail': "Vous avez atteint votre quota maximal d'étudiants. "
                           "Contactez l'administration pour une dérogation."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if demande.statut != 'en_attente':
            return Response({'detail': "Seule une demande en attente peut être acceptée."},
                             status=status.HTTP_400_BAD_REQUEST)

        demande.statut = 'acceptee'
        demande.encadreur_effectif = encadreur
        demande.date_reponse = timezone.now()
        demande.save()
        security_logger.info("Demande #%s acceptée par %s", demande.id, request.user.username)
        return Response(DemandeSerializer(demande).data)

    @action(detail=True, methods=['post'])
    def refuser(self, request, pk=None):
        demande = self.get_object()
        # RG "Justification obligatoire"
        serializer = DemandeRefusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        demande.statut = 'refusee'
        demande.date_reponse = timezone.now()
        demande.commentaire_encadreur = serializer.validated_data['commentaire']
        demande.save()
        security_logger.info("Demande #%s refusée par %s", demande.id, request.user.username)
        return Response(DemandeSerializer(demande).data)

    @action(detail=True, methods=['post'])
    def valider_finale(self, request, pk=None):
        """RG 'Quitus de fin de suivi' : l'encadreur valide définitivement le
        dossier, ce qui rend l'étudiant éligible à la soutenance."""
        demande = self.get_object()
        if demande.statut != 'acceptee':
            return Response({'detail': "Seul un dossier accepté peut être validé pour soutenance."},
                             status=status.HTTP_400_BAD_REQUEST)
        demande.eligible_soutenance = True
        demande.date_validation_finale = timezone.now()
        demande.save()
        security_logger.info("Demande #%s validée pour soutenance par %s", demande.id, request.user.username)
        return Response(DemandeSerializer(demande).data)

    @action(detail=True, methods=['post'])
    def reaffecter(self, request, pk=None):
        """RG 'Droit d'arbitrage administratif' : l'administration réaffecte
        d'office un étudiant à un encadreur disponible."""
        demande = self.get_object()
        serializer = DemandeReaffectationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        nouvel_encadreur = serializer.validated_data['encadreur_id']
        demande.encadreur_effectif = nouvel_encadreur
        demande.statut = 'acceptee'
        demande.reaffectee_par_admin = True
        demande.date_reponse = timezone.now()
        commentaire = serializer.validated_data.get('commentaire', '')
        if commentaire:
            demande.commentaire_encadreur = commentaire
        demande.save()
        security_logger.info(
            "Demande #%s réaffectée d'office à %s par l'administrateur %s",
            demande.id, nouvel_encadreur.user.username, request.user.username,
        )
        return Response(DemandeSerializer(demande).data)


class DocumentViewSet(viewsets.ModelViewSet):
    serializer_class = DocumentSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            qs = Document.objects.all()
        elif user.role == 'encadreur':
            enc = user.profil_encadreur
            qs = Document.objects.filter(demande__encadreur_effectif=enc)
        else:
            qs = Document.objects.filter(demande__etudiant=user.profil_etudiant)
        return qs.select_related('demande')

    def perform_create(self, serializer):
        demande_id = self.request.data.get('demande')
        demande = get_object_or_404(Demande, id=demande_id)
        if self.request.user.role != 'admin' and demande.etudiant.user != self.request.user:
            raise PermissionDenied("Vous n'êtes pas autorisé à ajouter un document à cette demande.")
        if demande.eligible_soutenance:
            raise ValidationError("Le dossier a été validé par l'encadreur : le dépôt est verrouillé.")
        # RG "Versionnage linéaire" : incrémentation automatique, aucun écrasement
        last_version = Document.objects.filter(demande=demande).order_by('-version').first()
        version = (last_version.version + 1) if last_version else 1
        serializer.save(demande=demande, version=version)

    @action(detail=True, methods=['post'], permission_classes=[IsEncadreurDuDocument | IsAdminRole])
    def annoter(self, request, pk=None):
        """RG 'Consultation et annotation' : l'encadreur commente une version précise."""
        document = self.get_object()
        commentaire = request.data.get('commentaire', '').strip()
        if not commentaire:
            return Response({'detail': 'Un commentaire est requis.'}, status=status.HTTP_400_BAD_REQUEST)
        document.commentaire_encadreur = commentaire
        document.save(update_fields=['commentaire_encadreur'])
        return Response(DocumentSerializer(document).data)
