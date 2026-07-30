from django.db import models


class Entreprise(models.Model):
    """Annuaire des entreprises partenaires (module F05 du cahier des
    charges) — gestion CRUD réservée à l'administration."""

    nom = models.CharField(max_length=200)
    ville = models.CharField(max_length=100, blank=True)
    secteur_activite = models.CharField(max_length=150, blank=True)
    nom_contact = models.CharField(max_length=150, blank=True)
    email_contact = models.EmailField(blank=True)
    telephone_contact = models.CharField(max_length=30, blank=True)
    adresse = models.CharField(max_length=255, blank=True)
    notes = models.TextField(blank=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['nom']

    def __str__(self):
        return self.nom

    @property
    def nombre_stagiaires(self):
        """Nombre de demandes ayant renseigné cette entreprise comme structure
        d'accueil (rapprochement par nom, le champ Demande.entreprise étant
        un texte libre saisi par l'étudiant)."""
        from demandes.models import Demande
        return Demande.objects.filter(entreprise__iexact=self.nom).count()
