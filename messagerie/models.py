from django.db import models
from accounts.models import Utilisateur
from demandes.models import Demande

class Message(models.Model):
    expediteur = models.ForeignKey(Utilisateur, on_delete=models.CASCADE, related_name='messages_envoyes')
    destinataire = models.ForeignKey(Utilisateur, on_delete=models.CASCADE, related_name='messages_recus')
    demande = models.ForeignKey(Demande, on_delete=models.CASCADE, related_name='messages')
    contenu = models.TextField()
    lu = models.BooleanField(default=False)
    date_envoi = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['date_envoi']

    def __str__(self):
        return f"De {self.expediteur.username} à {self.destinataire.username} - {self.date_envoi}"