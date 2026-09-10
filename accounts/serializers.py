from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.utils.crypto import get_random_string
from rest_framework import serializers

from .models import ProfilEtudiant, ProfilEncadreur

Utilisateur = get_user_model()


class ProfilEtudiantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProfilEtudiant
        fields = ['id', 'numero_etudiant', 'filiere', 'niveau', 'telephone', 'adresse', 'photo']
        read_only_fields = ['id', 'numero_etudiant']


class ProfilEncadreurSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProfilEncadreur
        fields = ['id', 'departement', 'specialite', 'telephone', 'photo']
        read_only_fields = ['id']


class MeSerializer(serializers.ModelSerializer):
    profil_etudiant = ProfilEtudiantSerializer(read_only=True)
    profil_encadreur = ProfilEncadreurSerializer(read_only=True)

    class Meta:
        model = Utilisateur
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role',
                  'profil_etudiant', 'profil_encadreur']
        read_only_fields = ['id', 'username', 'role']


class ChangePasswordSerializer(serializers.Serializer):
    ancien_mot_de_passe = serializers.CharField(write_only=True)
    nouveau_mot_de_passe = serializers.CharField(write_only=True)

    def validate_nouveau_mot_de_passe(self, value):
        validate_password(value)
        return value


class EncadreurAnnuaireSerializer(serializers.ModelSerializer):
    """Représentation légère utilisée dans la liste déroulante de choix
    d'encadreur : expose le taux de charge sans données personnelles
    sensibles, conformément au principe de moindre privilège."""

    nom = serializers.CharField(source='user.get_full_name', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    nombre_etudiants_acceptes = serializers.IntegerField(read_only=True)
    est_sature = serializers.BooleanField(read_only=True)

    class Meta:
        model = ProfilEncadreur
        fields = ['id', 'nom', 'username', 'departement', 'specialite',
                  'quota_max', 'nombre_etudiants_acceptes', 'est_sature']
        read_only_fields = ['id', 'nom', 'username', 'departement', 'specialite',
                             'nombre_etudiants_acceptes', 'est_sature']


class EncadreurQuotaUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProfilEncadreur
        fields = ['quota_max']


class UtilisateurAdminSerializer(serializers.ModelSerializer):
    """Utilisé par l'administrateur système pour la gestion des comptes
    (création, désactivation, réinitialisation)."""

    password = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = Utilisateur
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role',
                  'is_active', 'password', 'date_joined', 'last_login']
        read_only_fields = ['id', 'date_joined', 'last_login']

    def validate_password(self, value):
        if value:
            validate_password(value)
        return value

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = Utilisateur(**validated_data)
        # Django 5.1+ a supprimé make_random_password() : on utilise get_random_string()
        user.set_password(password or get_random_string(length=12))
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance