from rest_framework import serializers
from .models import Demande, Document

class DemandeSerializer(serializers.ModelSerializer):
    etudiant_nom = serializers.CharField(source='etudiant.user.username', read_only=True)
    encadreur_souhaite_nom = serializers.CharField(source='encadreur_souhaite.user.username', read_only=True)
    encadreur_effectif_nom = serializers.CharField(source='encadreur_effectif.user.username', read_only=True)

    class Meta:
        model = Demande
        fields = ['id', 'etudiant', 'etudiant_nom', 'encadreur_souhaite', 'encadreur_souhaite_nom',
                  'encadreur_effectif', 'encadreur_effectif_nom', 'theme', 'entreprise',
                  'statut', 'commentaire_encadreur', 'date_soumission', 'date_reponse']
        read_only_fields = ['id', 'date_soumission', 'date_reponse']


    def validate(self, data):
        # Règle RG1 : vérifier qu'il n'y a pas déjà une demande active
        etudiant = data.get('etudiant')
        # Si l'étudiant n'est pas dans data (ex: création par étudiant connecté), on le récupère via le contexte
        request = self.context.get('request')
        if request and request.user.role == 'etudiant':
            etudiant = request.user.profil_etudiant
        if etudiant:
            actives = Demande.objects.filter(etudiant=etudiant, statut__in=['en_attente', 'acceptee'])
            if self.instance is None and actives.exists():
                raise serializers.ValidationError("Vous avez déjà une demande en cours.")
        return data
        
        

class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ['id', 'demande', 'fichier', 'version', 'type_doc', 'date_depot']
        read_only_fields = ['id', 'version', 'date_depot']

    def validate_fichier(self, value):
        if value.size > 10 * 1024 * 1024:
            raise serializers.ValidationError("Le fichier ne doit pas dépasser 10 Mo.")
        return value