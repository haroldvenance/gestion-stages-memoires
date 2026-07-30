from rest_framework import serializers
from .models import Entreprise


class EntrepriseSerializer(serializers.ModelSerializer):
    nombre_stagiaires = serializers.IntegerField(read_only=True)

    class Meta:
        model = Entreprise
        fields = [
            'id', 'nom', 'ville', 'secteur_activite', 'nom_contact', 'email_contact',
            'telephone_contact', 'adresse', 'notes', 'nombre_stagiaires',
            'date_creation', 'date_modification',
        ]
        read_only_fields = ['id', 'date_creation', 'date_modification']
