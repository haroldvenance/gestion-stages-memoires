from django.contrib.auth.models import AbstractUser
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver

class Utilisateur(AbstractUser):
    ROLE_CHOICES = [
        ('etudiant', 'Étudiant'),
        ('encadreur', 'Encadreur'),
        ('admin', 'Administrateur'),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='etudiant')

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"



        
        
class ProfilEtudiant(models.Model):
    user = models.OneToOneField(Utilisateur, on_delete=models.CASCADE, related_name='profil_etudiant')
    numero_etudiant = models.CharField(max_length=20, unique=True, null=True, blank=True)
    filiere = models.CharField(max_length=100, blank=True)
    niveau = models.CharField(max_length=20, blank=True)

    def __str__(self):
        return f"{self.user.username} - {self.numero_etudiant or 'N/A'}"


class ProfilEncadreur(models.Model):
    user = models.OneToOneField(
        Utilisateur,
        on_delete=models.CASCADE,
        related_name='profil_encadreur'
    )
    departement = models.CharField(max_length=100)
    specialite = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return self.user.username


# Signal pour créer automatiquement le profil selon le rôle
@receiver(post_save, sender=Utilisateur)
def creer_profil(sender, instance, created, **kwargs):
    if created:
        if instance.role == 'etudiant':
            ProfilEtudiant.objects.create(user=instance)
        elif instance.role == 'encadreur':
            ProfilEncadreur.objects.create(user=instance)
        # Les admins n'ont pas de profil supplémentaire