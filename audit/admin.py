from django.contrib import admin
from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('horodatage', 'utilisateur', 'role_utilisateur', 'action', 'statut_code', 'niveau', 'adresse_ip')
    list_filter = ('niveau', 'role_utilisateur', 'methode')
    search_fields = ('action', 'chemin', 'utilisateur__username', 'adresse_ip')
    readonly_fields = [f.name for f in AuditLog._meta.fields]
    ordering = ('-horodatage',)

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
