from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Utilisateur, ProfilEtudiant, ProfilEncadreur

class UtilisateurAdmin(UserAdmin):
    list_display = ('username', 'email', 'role', 'is_staff', 'is_active')
    list_filter = ('role', 'is_staff', 'is_active')
    fieldsets = UserAdmin.fieldsets + (
        ('Informations supplémentaires', {'fields': ('role',)}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Informations supplémentaires', {'fields': ('role',)}),
    )

class ProfilEncadreurAdmin(admin.ModelAdmin):
    list_display = ('user', 'departement', 'specialite', 'quota_max', 'nombre_etudiants_acceptes', 'est_sature')
    list_editable = ('quota_max',)


class ProfilEtudiantAdmin(admin.ModelAdmin):
    list_display = ('user', 'numero_etudiant', 'filiere', 'niveau')
    search_fields = ('numero_etudiant', 'user__username')


admin.site.register(Utilisateur, UtilisateurAdmin)
admin.site.register(ProfilEtudiant, ProfilEtudiantAdmin)
admin.site.register(ProfilEncadreur, ProfilEncadreurAdmin)