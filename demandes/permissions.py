from rest_framework import permissions
from django.db import models  # ajouté pour Q




class IsEtudiant(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'etudiant'

class IsEncadreur(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'encadreur'

class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'

class IsProprietaireDemande(permissions.BasePermission):
    """Vérifie que l'utilisateur est l'étudiant propriétaire de la demande."""
    def has_object_permission(self, request, view, obj):
        # obj est une instance de Demande
        return request.user == obj.etudiant.user

class IsEncadreurDeLaDemande(permissions.BasePermission):
    """Vérifie que l'utilisateur est l'encadreur (souhaité ou effectif) de la demande."""
    def has_object_permission(self, request, view, obj):
        if request.user.role == 'encadreur':
            encadreur = request.user.profil_encadreur
            return obj.encadreur_souhaite == encadreur or obj.encadreur_effectif == encadreur
        return False