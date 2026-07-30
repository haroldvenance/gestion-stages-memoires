from rest_framework import serializers
from .models import PropositionCreneau, Soutenance, Jury


class PlanificationAutoSerializer(serializers.Serializer):
    """Entrée de la planification automatique : dates et salles disponibles,
    plage horaire de travail, durée par soutenance."""
    dates = serializers.ListField(child=serializers.DateField(), min_length=1)
    salles = serializers.ListField(child=serializers.CharField(max_length=50), min_length=1)
    heure_debut = serializers.TimeField(default='08:00')
    heure_fin = serializers.TimeField(default='17:00')
    duree_heures = serializers.FloatField(default=1, min_value=0.5, max_value=4)
    demande_ids = serializers.ListField(child=serializers.IntegerField(), required=False)

    def validate(self, data):
        if data['heure_fin'] <= data['heure_debut']:
            raise serializers.ValidationError("L'heure de fin doit être postérieure à l'heure de début.")
        return data


class PropositionCreneauSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropositionCreneau
        fields = ['id', 'demande', 'encadreur', 'date_proposee', 'heure_debut', 'duree_heures', 'salle']


class JurySerializer(serializers.ModelSerializer):
    enseignant_nom = serializers.CharField(source='enseignant.user.username', read_only=True)
    role_jury_display = serializers.CharField(source='get_role_jury_display', read_only=True)

    class Meta:
        model = Jury
        fields = ['id', 'soutenance', 'enseignant', 'enseignant_nom', 'role_jury', 'role_jury_display']


class SoutenanceSerializer(serializers.ModelSerializer):
    demande_theme = serializers.CharField(source='demande.theme', read_only=True)
    demande_etudiant_nom = serializers.CharField(source='demande.etudiant.user.get_full_name', read_only=True)
    demande_encadreur_nom = serializers.CharField(
        source='demande.encadreur_effectif.user.username', read_only=True, default=None
    )
    jury = JurySerializer(source='membres', many=True, read_only=True)
    proposition_id = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = Soutenance
        fields = ['id', 'demande', 'demande_theme', 'demande_etudiant_nom', 'demande_encadreur_nom',
                  'date_proposee', 'heure_debut', 'salle', 'duree_heures', 'statut', 'validee_par',
                  'pv_url', 'mention_provisoire', 'jury', 'proposition_id']
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
