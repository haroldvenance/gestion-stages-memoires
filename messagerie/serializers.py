from rest_framework import serializers

from demandes.models import Demande
from .models import Message


class MessageSerializer(serializers.ModelSerializer):
    expediteur_nom = serializers.CharField(source='expediteur.username', read_only=True)
    destinataire_nom = serializers.CharField(source='destinataire.username', read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'expediteur', 'expediteur_nom', 'destinataire', 'destinataire_nom',
                  'demande', 'contenu', 'lu', 'date_envoi']
        read_only_fields = ['id', 'expediteur', 'date_envoi', 'lu']

    def validate(self, data):
        request = self.context.get('request')
        demande: Demande = data.get('demande')
        destinataire = data.get('destinataire')
        user = request.user if request else None

        if not demande or not destinataire or not user:
            raise serializers.ValidationError("Dossier et destinataire requis.")

        # RG "Canal de messagerie fermé" : un étudiant ne peut écrire qu'à son
        # encadreur attitré, et réciproquement.
        if user.role == 'etudiant':
            if demande.etudiant.user_id != user.id:
                raise serializers.ValidationError("Ce dossier ne vous appartient pas.")
            if not demande.encadreur_effectif or destinataire.id != demande.encadreur_effectif.user_id:
                raise serializers.ValidationError(
                    "Vous ne pouvez échanger qu'avec l'encadreur attitré à ce dossier."
                )
        elif user.role == 'encadreur':
            if not demande.encadreur_effectif or demande.encadreur_effectif.user_id != user.id:
                raise serializers.ValidationError("Vous n'encadrez pas ce dossier.")
            if destinataire.id != demande.etudiant.user_id:
                raise serializers.ValidationError(
                    "Vous ne pouvez répondre qu'à l'étudiant que vous encadrez sur ce dossier."
                )
        elif user.role != 'admin':
            raise serializers.ValidationError("Rôle non autorisé à utiliser la messagerie.")

        return data
