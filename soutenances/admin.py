from django.contrib import admin
from .models import PropositionCreneau, Soutenance, Jury

admin.site.register(PropositionCreneau)
admin.site.register(Soutenance)
admin.site.register(Jury)