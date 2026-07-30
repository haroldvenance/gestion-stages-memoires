from rest_framework import serializers
from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    utilisateur_nom = serializers.CharField(source='utilisateur.username', read_only=True, default=None)

    class Meta:
        model = AuditLog
        fields = [
            'id', 'utilisateur', 'utilisateur_nom', 'role_utilisateur', 'action',
            'methode', 'chemin', 'statut_code', 'adresse_ip', 'niveau', 'details',
            'horodatage',
        ]
        read_only_fields = fields
