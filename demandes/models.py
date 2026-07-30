from django.db import models
from django.core.exceptions import ValidationError
from accounts.models import ProfilEtudiant, ProfilEncadreur

class Demande(models.Model):
    STATUT_CHOICES = [
        ('en_attente', 'En attente'),
        ('acceptee', 'Acceptée'),
        ('refusee', 'Refusée'),
    ]

    etudiant = models.ForeignKey(ProfilEtudiant, on_delete=models.CASCADE, related_name='demandes')
    encadreur_souhaite = models.ForeignKey(ProfilEncadreur, on_delete=models.SET_NULL, null=True, related_name='demandes_souhaitees')
    encadreur_effectif = models.ForeignKey(ProfilEncadreur, on_delete=models.SET_NULL, null=True, blank=True, related_name='demandes_effectives')
    theme = models.TextField()
    entreprise = models.CharField(max_length=200, blank=True)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='en_attente')
    commentaire_encadreur = models.TextField(blank=True)
    date_soumission = models.DateTimeField(auto_now_add=True)
    date_reponse = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-date_soumission']
        permissions = [
            ("view_own_demande", "Peut voir ses propres demandes"),
            ("change_own_demande", "Peut modifier sa demande avant acceptation"),
            ("view_demande_souhaitee", "Peut voir les demandes où il est encadreur souhaité"),
        ]

    def clean(self):
        # RG1 : Un étudiant ne peut avoir qu'une seule demande active (en_attente ou acceptée)
        if self.pk is None:  # nouvelle demande
            actives = Demande.objects.filter(etudiant=self.etudiant, statut__in=['en_attente', 'acceptee'])
            if actives.exists():
                raise ValidationError("Vous avez déjà une demande en cours (en attente ou acceptée).")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.etudiant.user.username} - {self.theme[:50]}"


class Document(models.Model):
    TYPE_CHOICES = [
        ('brouillon', 'Brouillon'),
        ('final', 'Version finale'),
        ('rapport_stage', 'Rapport de stage'),
        ('autre', 'Autre'),
    ]

    demande = models.ForeignKey(Demande, on_delete=models.CASCADE, related_name='documents')
    fichier = models.FileField(upload_to='documents/%Y/%m/%d/')
    version = models.PositiveIntegerField(default=1)
    type_doc = models.CharField(max_length=30, choices=TYPE_CHOICES)
    date_depot = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('demande', 'version')
        ordering = ['-version']

    def clean(self):
        # RG4 : Validation taille et extension
        if self.fichier:
            if self.fichier.size > 10 * 1024 * 1024:
                raise ValidationError("Le fichier ne doit pas dépasser 10 Mo.")
            ext = self.fichier.name.split('.')[-1].lower()
            if ext not in ['pdf', 'docx', 'odt', 'jpg', 'png']:
                raise ValidationError("Extension non autorisée. Utilisez PDF, DOCX, ODT, JPG ou PNG.")
        # Vérifier unicité demande/version (déjà géré par unique_together)

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Document {self.version} - {self.demande.theme[:30]}"