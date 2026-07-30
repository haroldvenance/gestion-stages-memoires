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
    entreprise_ville = models.CharField(max_length=100, blank=True)
    maitre_stage_nom = models.CharField(max_length=150, blank=True)
    maitre_stage_email = models.EmailField(blank=True)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='en_attente')
    commentaire_encadreur = models.TextField(blank=True)
    date_soumission = models.DateTimeField(auto_now_add=True)
    date_reponse = models.DateTimeField(null=True, blank=True)
    # RG "Droit d'arbitrage administratif" / "Attribution automatique ou manuelle"
    reaffectee_par_admin = models.BooleanField(default=False)
    # RG "Quitus de fin de suivi" : l'encadreur valide le dossier avant soutenance
    eligible_soutenance = models.BooleanField(default=False)
    date_validation_finale = models.DateTimeField(null=True, blank=True)
    # RG "Archivage automatique"
    archivee = models.BooleanField(default=False)

    class Meta:
        ordering = ['-date_soumission']
        permissions = [
            ("view_own_demande", "Peut voir ses propres demandes"),
            ("change_own_demande", "Peut modifier sa demande avant acceptation"),
            ("view_demande_souhaitee", "Peut voir les demandes où il est encadreur souhaité"),
        ]

    def clean(self):
        # RG1 : Un étudiant ne peut avoir qu'une seule demande active (en_attente ou acceptée)
        # RG "Unicité des dossiers" : un seul dossier actif par année académique.
        if self.pk is None:  # nouvelle demande
            actives = Demande.objects.filter(etudiant=self.etudiant, statut__in=['en_attente', 'acceptee'])
            if actives.exists():
                raise ValidationError("Vous avez déjà une demande en cours (en attente ou acceptée).")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    @property
    def modifiable(self):
        """RG 'Modifier la demande' : uniquement si En attente ou Refusée
        avec commentaire — verrouillée dès qu'un encadreur est validé."""
        return self.statut in ('en_attente', 'refusee')

    def __str__(self):
        return f"{self.etudiant.user.username} - {self.theme[:50]}"


class Document(models.Model):
    TYPE_CHOICES = [
        ('brouillon', 'Brouillon'),
        ('final', 'Version finale'),
        ('rapport_stage', 'Rapport de stage'),
        ('autre', 'Autre'),
    ]

    EXTENSIONS_AUTORISEES = ['pdf', 'doc', 'docx']
    TAILLE_MAX_OCTETS = 15 * 1024 * 1024  # 15 Mo, cf. cahier des charges (RG "Restriction des fichiers")

    demande = models.ForeignKey(Demande, on_delete=models.CASCADE, related_name='documents')
    fichier = models.FileField(upload_to='documents/%Y/%m/%d/')
    version = models.PositiveIntegerField(default=1)
    type_doc = models.CharField(max_length=30, choices=TYPE_CHOICES)
    commentaire_encadreur = models.TextField(blank=True)
    date_depot = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('demande', 'version')
        ordering = ['-version']

    def clean(self):
        # RG4 : Validation taille (15 Mo max) et extension (PDF ou Word uniquement)
        if self.fichier:
            if self.fichier.size > self.TAILLE_MAX_OCTETS:
                raise ValidationError("Le fichier ne doit pas dépasser 15 Mo.")
            ext = self.fichier.name.rsplit('.', 1)[-1].lower() if '.' in self.fichier.name else ''
            if ext not in self.EXTENSIONS_AUTORISEES:
                raise ValidationError("Extension non autorisée. Utilisez PDF, DOC ou DOCX.")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Document {self.version} - {self.demande.theme[:30]}"