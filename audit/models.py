from django.conf import settings
from django.db import models


class AuditLog(models.Model):
    """Journal des actions sensibles et des requêtes API.

    Répond à l'exigence "Traçabilité des actions" du cahier des charges :
    les actions sensibles (validation d'une demande, réaffectation d'un
    encadreur, tentative d'accès non autorisée, etc.) sont journalisées
    avec horodatage et identification de l'auteur.
    """

    NIVEAU_CHOICES = [
        ('info', 'Information'),
        ('warning', 'Avertissement'),
        ('security', 'Sécurité'),
    ]

    utilisateur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='logs_audit',
    )
    role_utilisateur = models.CharField(max_length=20, blank=True)
    action = models.CharField(max_length=255)
    methode = models.CharField(max_length=10, blank=True)
    chemin = models.CharField(max_length=500, blank=True)
    statut_code = models.PositiveIntegerField(null=True, blank=True)
    adresse_ip = models.GenericIPAddressField(null=True, blank=True)
    niveau = models.CharField(max_length=20, choices=NIVEAU_CHOICES, default='info')
    details = models.TextField(blank=True)
    horodatage = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-horodatage']
        indexes = [
            models.Index(fields=['-horodatage']),
            models.Index(fields=['utilisateur']),
            models.Index(fields=['niveau']),
        ]

    def __str__(self):
        who = self.utilisateur.username if self.utilisateur else 'anonyme'
        return f"[{self.horodatage:%Y-%m-%d %H:%M:%S}] {who} - {self.action}"
