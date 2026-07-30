import csv
import io
import logging

from django.contrib.auth import get_user_model
from rest_framework import generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import ProfilEncadreur
from .permissions import IsAdmin, IsAuthenticatedReadOnlyOrAdmin
from .serializers import (
    ChangePasswordSerializer,
    EncadreurAnnuaireSerializer,
    EncadreurQuotaUpdateSerializer,
    MeSerializer,
    UtilisateurAdminSerializer,
)

Utilisateur = get_user_model()
security_logger = logging.getLogger('audit')


class MeView(generics.RetrieveUpdateAPIView):
    """Consultation et mise à jour du profil de l'utilisateur connecté.
    RG : un étudiant/encadreur ne peut modifier que ses propres coordonnées."""

    permission_classes = [IsAuthenticated]
    serializer_class = MeSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_object(self):
        return self.request.user

    def patch(self, request, *args, **kwargs):
        user = request.user
        for field in ('email', 'first_name', 'last_name'):
            if field in request.data:
                setattr(user, field, request.data[field])
        user.save()

        profil = getattr(user, 'profil_etudiant', None) or getattr(user, 'profil_encadreur', None)
        if profil:
            for field in ('telephone', 'adresse', 'photo'):
                if field in request.data and hasattr(profil, field):
                    setattr(profil, field, request.data[field])
            profil.save()

        return Response(MeSerializer(user).data)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user
        if not user.check_password(serializer.validated_data['ancien_mot_de_passe']):
            security_logger.warning("Echec de changement de mot de passe pour %s (ancien mdp invalide)", user.username)
            return Response({'detail': "Mot de passe actuel incorrect."}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(serializer.validated_data['nouveau_mot_de_passe'])
        user.save()
        security_logger.info("Mot de passe changé pour %s", user.username)
        return Response({'detail': 'Mot de passe mis à jour avec succès.'})


class EncadreurViewSet(viewsets.ReadOnlyModelViewSet):
    """Annuaire des encadreurs avec indicateur de saturation, utilisé par le
    formulaire de demande (RG "Blocage automatique") et la console de
    régulation des quotas de l'administration."""

    serializer_class = EncadreurAnnuaireSerializer
    permission_classes = [IsAuthenticatedReadOnlyOrAdmin]
    queryset = ProfilEncadreur.objects.select_related('user').all()

    @action(detail=True, methods=['patch'], permission_classes=[IsAdmin])
    def quota(self, request, pk=None):
        """Permet à l'administration d'ajuster le quota maximal d'un
        encadreur (RG "Quotas configurables et ajustables")."""
        encadreur = self.get_object()
        serializer = EncadreurQuotaUpdateSerializer(encadreur, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(EncadreurAnnuaireSerializer(encadreur).data)


class UtilisateurAdminViewSet(viewsets.ModelViewSet):
    """Gestion des comptes réservée à l'administrateur système : création,
    désactivation/réactivation, réinitialisation de mot de passe, import
    massif de matricules étudiants."""

    serializer_class = UtilisateurAdminSerializer
    permission_classes = [IsAdmin]
    queryset = Utilisateur.objects.all().order_by('username')
    filterset_fields = ['role', 'is_active']
    search_fields = ['username', 'email', 'first_name', 'last_name']

    @action(detail=True, methods=['post'])
    def reinitialiser_mot_de_passe(self, request, pk=None):
        user = self.get_object()
        nouveau = Utilisateur.objects.make_random_password(length=12)
        user.set_password(nouveau)
        user.save()
        security_logger.info("Mot de passe réinitialisé pour %s par %s", user.username, request.user.username)
        # En production : envoi du mot de passe par e-mail plutôt que retourné en clair.
        return Response({'detail': 'Mot de passe réinitialisé.', 'mot_de_passe_temporaire': nouveau})

    @action(detail=True, methods=['post'])
    def desactiver(self, request, pk=None):
        user = self.get_object()
        user.is_active = False
        user.save()
        return Response({'detail': 'Compte désactivé.'})

    @action(detail=True, methods=['post'])
    def activer(self, request, pk=None):
        user = self.get_object()
        user.is_active = True
        user.save()
        return Response({'detail': 'Compte activé.'})

    @action(detail=False, methods=['post'], parser_classes=[MultiPartParser])
    def import_etudiants(self, request):
        """Import massif de matricules étudiants via CSV (colonnes attendues :
        matricule,nom,prenom,email,filiere,niveau)."""
        fichier = request.FILES.get('fichier')
        if not fichier:
            return Response({'detail': 'Aucun fichier fourni.'}, status=status.HTTP_400_BAD_REQUEST)
        if not fichier.name.lower().endswith('.csv'):
            return Response({'detail': 'Le fichier doit être au format CSV.'}, status=status.HTTP_400_BAD_REQUEST)

        contenu = io.TextIOWrapper(fichier.file, encoding='utf-8-sig')
        lecteur = csv.DictReader(contenu)
        crees, ignores, erreurs = [], [], []

        for ligne in lecteur:
            matricule = (ligne.get('matricule') or '').strip()
            if not matricule:
                erreurs.append({'ligne': ligne, 'erreur': 'matricule manquant'})
                continue
            if Utilisateur.objects.filter(username=matricule).exists():
                ignores.append(matricule)
                continue
            user = Utilisateur.objects.create_user(
                username=matricule,
                email=(ligne.get('email') or '').strip(),
                first_name=(ligne.get('prenom') or '').strip(),
                last_name=(ligne.get('nom') or '').strip(),
                role='etudiant',
                password=Utilisateur.objects.make_random_password(length=12),
            )
            profil = user.profil_etudiant
            profil.numero_etudiant = matricule
            profil.filiere = (ligne.get('filiere') or '').strip()
            profil.niveau = (ligne.get('niveau') or '').strip()
            profil.save()
            crees.append(matricule)

        return Response({
            'crees': crees,
            'ignores_deja_existants': ignores,
            'erreurs': erreurs,
        })
