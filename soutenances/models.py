from django.db import models
from django.core.exceptions import ValidationError
from datetime import datetime, timedelta
from accounts.models import ProfilEncadreur, Utilisateur
from demandes.models import Demande

class PropositionCreneau(models.Model):
    demande = models.ForeignKey(Demande, on_delete=models.CASCADE, related_name='propositions_creneaux')
    encadreur = models.ForeignKey(ProfilEncadreur, on_delete=models.CASCADE)
    date_proposee = models.DateField()
    heure_debut = models.TimeField()
    duree_heures = models.PositiveSmallIntegerField(default=1)
    salle = models.CharField(max_length=50)

    class Meta:
        ordering = ['date_proposee', 'heure_debut']

    def __str__(self):
        return f"Prop. pour {self.demande.theme[:30]} - {self.date_proposee} {self.heure_debut}"


class Soutenance(models.Model):
    STATUT_CHOICES = [
        ('proposee', 'Proposée'),
        ('validee', 'Validée'),
        ('annulee', 'Annulée'),
    ]

    demande = models.OneToOneField(Demande, on_delete=models.CASCADE, related_name='soutenance')
    date_proposee = models.DateField()
    heure_debut = models.TimeField()
    salle = models.CharField(max_length=50)
    duree_heures = models.PositiveSmallIntegerField(default=1)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='proposee')
    validee_par = models.ForeignKey(Utilisateur, on_delete=models.SET_NULL, null=True, blank=True, related_name='soutenances_validees')
    pv_url = models.URLField(blank=True, null=True)
    mention_provisoire = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['date_proposee', 'heure_debut']

    def clean(self):
        # RG "Condition de planification" : seul un dossier éligible (quitus
        # de l'encadreur obtenu) peut être intégré à la planification.
        if not self.demande.eligible_soutenance:
            raise ValidationError(
                "Cet étudiant n'est pas encore éligible à la soutenance "
                "(validation finale de l'encadreur manquante)."
            )

        if self.statut == 'validee':
            # RG7 : Vérifier chevauchement avec autre soutenance validée dans la même salle
            heure_fin_self = (datetime.combine(self.date_proposee, self.heure_debut) + timedelta(hours=self.duree_heures)).time()
            conflits = Soutenance.objects.filter(
                salle=self.salle,
                date_proposee=self.date_proposee,
                statut='validee'
            ).exclude(pk=self.pk)
            for s in conflits:
                heure_fin_other = (datetime.combine(s.date_proposee, s.heure_debut) + timedelta(hours=s.duree_heures)).time()
                if not (heure_fin_self <= s.heure_debut or self.heure_debut >= heure_fin_other):
                    raise ValidationError("Créneau chevauchant avec une autre soutenance validée dans cette salle.")
            
            # RG8 : Vérifier que le jury a au moins un président et un rapporteur
            # On vérifie uniquement si l'objet a déjà une clé primaire (sauvegardé)
            if self.pk is not None:
                # On force l'évaluation de la relation sans accès direct à self.membres
                membres = Jury.objects.filter(soutenance=self)
                if not membres.filter(role_jury='president').exists():
                    raise ValidationError("La soutenance doit avoir au moins un président.")
                if not membres.filter(role_jury='rapporteur').exists():
                    raise ValidationError("La soutenance doit avoir au moins un rapporteur.")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Soutenance {self.demande.theme[:30]} - {self.date_proposee}"


class Jury(models.Model):
    ROLE_CHOICES = [
        ('president', 'Président'),
        ('rapporteur', 'Rapporteur'),
        ('examinateur', 'Examinateur'),
    ]

    soutenance = models.ForeignKey(Soutenance, on_delete=models.CASCADE, related_name='membres')
    enseignant = models.ForeignKey(ProfilEncadreur, on_delete=models.CASCADE)
    role_jury = models.CharField(max_length=30, choices=ROLE_CHOICES)

    class Meta:
        unique_together = ('soutenance', 'enseignant', 'role_jury')

    def clean(self):
        if Jury.objects.filter(soutenance=self.soutenance, enseignant=self.enseignant).exclude(pk=self.pk).exists():
            raise ValidationError("Cet enseignant a déjà un rôle dans cette soutenance.")

        # RG "Rôle de l'encadreur dans le jury" : l'encadreur de l'étudiant doit
        # être membre du jury (par défaut Rapporteur) mais ne peut pas en être
        # le Président.
        encadreur_demande = self.soutenance.demande.encadreur_effectif
        if encadreur_demande and self.enseignant_id == encadreur_demande.id and self.role_jury == 'president':
            raise ValidationError("L'encadreur de l'étudiant ne peut pas être Président du jury.")

        # RG "Contrainte d'indisponibilité du jury" : un enseignant ne peut pas
        # être affecté à deux soutenances qui se chevauchent, même dans des
        # salles différentes.
        soutenance = self.soutenance
        if soutenance.date_proposee and soutenance.heure_debut:
            debut_self = datetime.combine(soutenance.date_proposee, soutenance.heure_debut)
            fin_self = debut_self + timedelta(hours=soutenance.duree_heures)
            autres = Jury.objects.filter(
                enseignant=self.enseignant,
                soutenance__date_proposee=soutenance.date_proposee,
            ).exclude(soutenance=soutenance).exclude(pk=self.pk)
            for autre in autres:
                debut_autre = datetime.combine(autre.soutenance.date_proposee, autre.soutenance.heure_debut)
                fin_autre = debut_autre + timedelta(hours=autre.soutenance.duree_heures)
                if debut_self < fin_autre and debut_autre < fin_self:
                    raise ValidationError(
                        f"{self.enseignant.user.username} est déjà membre du jury d'une autre "
                        "soutenance sur ce créneau."
                    )

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.enseignant.user.username} - {self.get_role_jury_display()}"