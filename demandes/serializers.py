from rest_framework import serializers

from accounts.models import ProfilEncadreur
from .models import Demande, Document


class DemandeSerializer(serializers.ModelSerializer):
    etudiant_nom = serializers.CharField(source='etudiant.user.get_full_name', read_only=True)
    etudiant_user = serializers.IntegerField(source='etudiant.user_id', read_only=True)
    encadreur_souhaite_nom = serializers.CharField(source='encadreur_souhaite.user.username', read_only=True)
    encadreur_effectif_nom = serializers.CharField(source='encadreur_effectif.user.username', read_only=True)
    encadreur_effectif_user = serializers.IntegerField(source='encadreur_effectif.user_id', read_only=True, default=None)
    modifiable = serializers.BooleanField(read_only=True)

    class Meta:
        model = Demande
        fields = ['id', 'etudiant', 'etudiant_nom', 'etudiant_user', 'encadreur_souhaite', 'encadreur_souhaite_nom',
                  'encadreur_effectif', 'encadreur_effectif_nom', 'encadreur_effectif_user', 'theme', 'entreprise',
                  'entreprise_ville', 'maitre_stage_nom', 'maitre_stage_email',
                  'statut', 'commentaire_encadreur', 'date_soumission', 'date_reponse',
                  'reaffectee_par_admin', 'eligible_soutenance', 'date_validation_finale',
                  'archivee', 'modifiable']
        read_only_fields = ['id', 'etudiant', 'date_soumission', 'date_reponse', 'statut',
                             'commentaire_encadreur', 'encadreur_effectif',
                             'reaffectee_par_admin', 'eligible_soutenance',
                             'date_validation_finale', 'archivee']

    def validate(self, data):
        request = self.context.get('request')
        etudiant = self.instance.etudiant if self.instance else None
        if request and getattr(request.user, 'role', None) == 'etudiant':
            etudiant = getattr(request.user, 'profil_etudiant', None)

        # RG1 / RG "Unicité des dossiers" : une seule demande active à la fois
        if etudiant and self.instance is None:
            actives = Demande.objects.filter(etudiant=etudiant, statut__in=['en_attente', 'acceptee'])
            if actives.exists():
                raise serializers.ValidationError("Vous avez déjà une demande en cours.")

        # RG "Complétude de la demande" : thème, encadreur, entreprise obligatoires à la création
        if self.instance is None:
            for champ in ('theme', 'encadreur_souhaite', 'entreprise'):
                if not data.get(champ):
                    raise serializers.ValidationError({champ: "Ce champ est obligatoire."})

        # RG "Blocage automatique" : impossible de soumettre vers un encadreur saturé
        encadreur = data.get('encadreur_souhaite')
        if encadreur and isinstance(encadreur, ProfilEncadreur) and encadreur.est_sature:
            raise serializers.ValidationError({
                'encadreur_souhaite': "Cet encadreur a atteint son quota maximal d'étudiants (saturé)."
            })

        # RG "Verrouillage du thème" : une demande acceptée ne peut plus être modifiée
        if self.instance is not None and not self.instance.modifiable:
            raise serializers.ValidationError(
                "Cette demande est verrouillée (déjà validée) et ne peut plus être modifiée."
            )

        return data


class DemandeRefusSerializer(serializers.Serializer):
    """RG 'Justification obligatoire' : tout refus exige un commentaire."""
    commentaire = serializers.CharField(min_length=5, allow_blank=False)


class DemandeReaffectationSerializer(serializers.Serializer):
    """RG 'Droit d'arbitrage administratif' / 'Réaffectation'."""
    encadreur_id = serializers.PrimaryKeyRelatedField(queryset=ProfilEncadreur.objects.all())
    commentaire = serializers.CharField(required=False, allow_blank=True)

    def validate_encadreur_id(self, value):
        if value.est_sature:
            raise serializers.ValidationError("Cet encadreur est déjà saturé, choisissez-en un autre.")
        return value


class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ['id', 'demande', 'fichier', 'version', 'type_doc',
                  'commentaire_encadreur', 'date_depot']
        read_only_fields = ['id', 'version', 'date_depot', 'commentaire_encadreur']

    def validate_fichier(self, value):
        # RG "Restriction des fichiers" : PDF/Word uniquement, 15 Mo max
        if value.size > Document.TAILLE_MAX_OCTETS:
            raise serializers.ValidationError("Le fichier ne doit pas dépasser 15 Mo.")
        ext = value.name.rsplit('.', 1)[-1].lower() if '.' in value.name else ''
        if ext not in Document.EXTENSIONS_AUTORISEES:
            raise serializers.ValidationError("Extension non autorisée. Utilisez PDF, DOC ou DOCX.")
        return value

    def validate_demande(self, value):
        if value.eligible_soutenance:
            raise serializers.ValidationError(
                "Le dossier a été validé par l'encadreur : le dépôt de documents est verrouillé."
            )
        return value
