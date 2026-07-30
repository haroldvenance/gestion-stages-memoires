from rest_framework import serializers
from .models import PropositionCreneau, Soutenance, Jury

class PropositionCreneauSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropositionCreneau
        fields = ['id', 'demande', 'encadreur', 'date_proposee', 'heure_debut', 'duree_heures', 'salle']

class SoutenanceSerializer(serializers.ModelSerializer):
    demande_theme = serializers.CharField(source='demande.theme', read_only=True)
    proposition_id = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = Soutenance
        fields = ['id', 'demande', 'demande_theme', 'date_proposee', 'heure_debut', 'salle',
                  'duree_heures', 'statut', 'validee_par', 'pv_url', 'mention_provisoire',
                  'proposition_id']
        read_only_fields = ['id']

    def create(self, validated_data):
        proposition_id = validated_data.pop('proposition_id', None)
        if proposition_id:
            try:
                proposition = PropositionCreneau.objects.get(id=proposition_id)
            except PropositionCreneau.DoesNotExist:
                raise serializers.ValidationError({"proposition_id": "Proposition introuvable."})
            validated_data['demande'] = proposition.demande
            validated_data['date_proposee'] = proposition.date_proposee
            validated_data['heure_debut'] = proposition.heure_debut
            validated_data['salle'] = proposition.salle
            validated_data['duree_heures'] = proposition.duree_heures
            validated_data['statut'] = 'validee'  # ou 'proposee' selon besoin
        return super().create(validated_data)

class JurySerializer(serializers.ModelSerializer):
    enseignant_nom = serializers.CharField(source='enseignant.user.username', read_only=True)
    class Meta:
        model = Jury
        fields = ['id', 'soutenance', 'enseignant', 'enseignant_nom', 'role_jury']