from django.contrib import admin
from .models import Entreprise


@admin.register(Entreprise)
class EntrepriseAdmin(admin.ModelAdmin):
    list_display = ('nom', 'ville', 'secteur_activite', 'email_contact', 'nombre_stagiaires')
    search_fields = ('nom', 'ville')
