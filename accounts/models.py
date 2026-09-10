from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver


class UserManager(BaseUserManager):
    """
    Manager personnalisé qui force role='admin' pour les superusers.
    Sans cela, les superusers auraient role='etudiant' (valeur par défaut).
    """

    def create_user(self, username, email=None, password=None, **extra_fields):
        if not username:
            raise ValueError("Le nom d'utilisateur est obligatoire")
        email = self.normalize_email(email)
        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, email=None, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'admin')   # 🔑 La ligne cruciale

        if extra_fields.get('is_staff') is not True:
            raise ValueError("Le superuser doit avoir is_staff=True.")
        if extra_fields.get('is_superuser') is not True:
            raise ValueError("Le superuser doit avoir is_superuser=True.")

        return self.create_user(username, email, password, **extra_fields)


class Utilisateur(AbstractUser):
    ROLE_CHOICES = [
        ('etudiant', 'Étudiant'),
        ('encadreur', 'Encadreur'),
        ('admin', 'Administrateur'),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='etudiant')

    objects = UserManager()   # 🔑 Utilise notre manager personnalisé

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"


class ProfilEtudiant(models.Model):
    user = models.OneToOneField(Utilisateur, on_delete=models.CASCADE, related_name='profil_etudiant')
    numero_etudiant = models.CharField(max_length=20, unique=True, null=True, blank=True)
    filiere = models.CharField(max_length=100, blank=True)
    niveau = models.CharField(max_length=20, blank=True)
    telephone = models.CharField(max_length=30, blank=True)
    adresse = models.CharField(max_length=255, blank=True)
    photo = models.ImageField(upload_to='photos_profil/%Y/%m/', null=True, blank=True)

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
    telephone = models.CharField(max_length=30, blank=True)
    photo = models.ImageField(upload_to='photos_profil/%Y/%m/', null=True, blank=True)
    quota_max = models.PositiveSmallIntegerField(default=5)

    @property
    def nombre_etudiants_acceptes(self):
        return self.demandes_effectives.filter(statut='acceptee').count()

    @property
    def est_sature(self):
        return self.nombre_etudiants_acceptes >= self.quota_max

    def __str__(self):
        return self.user.username


@receiver(post_save, sender=Utilisateur)
def creer_profil(sender, instance, created, **kwargs):
    if created:
        if instance.role == 'etudiant':
            ProfilEtudiant.objects.create(user=instance)
        elif instance.role == 'encadreur':
            ProfilEncadreur.objects.create(user=instance)
        # Les admins n'ont pas de profil supplémentaire