from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Utilisateur, ProfilEtudiant, ProfilEncadreur

@receiver(post_save, sender=Utilisateur)
def creer_profil(sender, instance, created, **kwargs):
    if created:
        if instance.role == 'etudiant':
            ProfilEtudiant.objects.create(user=instance)
        elif instance.role == 'encadreur':
            ProfilEncadreur.objects.create(user=instance)