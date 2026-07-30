import io
import logging

from django.core.mail import EmailMessage
from django.db import models
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from accounts.permissions import IsAdmin as IsAdminRole
from demandes.permissions import IsEncadreur, IsAdmin, IsEtudiant
from .models import PropositionCreneau, Soutenance, Jury
from .scheduling import planifier_automatiquement
from .serializers import (
    PropositionCreneauSerializer, SoutenanceSerializer, JurySerializer, PlanificationAutoSerializer,
)

logger = logging.getLogger('app')


class PropositionCreneauViewSet(viewsets.ModelViewSet):
    serializer_class = PropositionCreneauSerializer
    permission_classes = [IsEncadreur | IsAdmin]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return PropositionCreneau.objects.all()
        return PropositionCreneau.objects.filter(encadreur=user.profil_encadreur)


class SoutenanceViewSet(viewsets.ModelViewSet):
    serializer_class = SoutenanceSerializer

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            self.permission_classes = [IsAdminRole | IsEncadreur | IsEtudiant]
        else:
            self.permission_classes = [IsAdmin]
        return super().get_permissions()

    def get_queryset(self):
        user = self.request.user
        qs = Soutenance.objects.select_related('demande__etudiant__user').all()
        if user.role == 'admin':
            return qs
        if user.role == 'encadreur':
            return qs.filter(
                models.Q(demande__encadreur_effectif=user.profil_encadreur)
                | models.Q(membres__enseignant=user.profil_encadreur)
            ).distinct()
        return qs.filter(demande__etudiant=user.profil_etudiant)

    @action(detail=False, methods=['post'])
    def planifier_auto(self, request):
        """RG 'Planification automatique' : propose un planning complet
        (créneau + jury) pour tous les dossiers éligibles non encore
        programmés, à partir des dates/salles/horaires fournis par
        l'administration. Les soutenances créées restent au statut
        'proposee' et doivent être validées individuellement."""
        serializer = PlanificationAutoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        resultat = planifier_automatiquement(**serializer.validated_data)
        logger.info(
            "Planification automatique par %s : %d planifiée(s), %d non planifiée(s)",
            request.user.username, len(resultat['planifiees']), len(resultat['non_planifiees']),
        )
        return Response(resultat)

    @action(detail=True, methods=['post'])
    def valider(self, request, pk=None):
        """RG : validation finale du planning par l'administration ->
        déclenche la génération et l'envoi des convocations."""
        soutenance = self.get_object()
        soutenance.statut = 'validee'
        soutenance.validee_par = request.user
        soutenance.save()
        email_ok, email_detail = self._envoyer_convocations(soutenance)
        payload = SoutenanceSerializer(soutenance).data
        payload['convocations_envoyees'] = email_ok
        payload['convocations_detail'] = email_detail
        return Response(payload)

    @action(detail=True, methods=['post'])
    def generer_pv(self, request, pk=None):
        soutenance = self.get_object()
        soutenance.pv_url = f"/api/soutenances/{soutenance.id}/telecharger_convocation/"
        soutenance.save()
        return Response({'pv_url': soutenance.pv_url})

    @action(detail=True, methods=['get'])
    def telecharger_convocation(self, request, pk=None):
        """RG 'Génération automatique de convocations PDF'."""
        soutenance = self.get_object()
        buffer = self._generer_pdf_convocation(soutenance)
        from django.http import HttpResponse
        http_response = HttpResponse(buffer.read(), content_type='application/pdf')
        http_response['Content-Disposition'] = f'attachment; filename="convocation_{soutenance.id}.pdf"'
        return http_response

    def _generer_pdf_convocation(self, soutenance):
        from reportlab.lib.pagesizes import A4
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
        from reportlab.lib.styles import getSampleStyleSheet

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        styles = getSampleStyleSheet()
        etudiant = soutenance.demande.etudiant.user
        elements = [
            Paragraph("Convocation à une soutenance", styles['Title']),
            Spacer(1, 20),
            Paragraph(f"Étudiant : {etudiant.get_full_name() or etudiant.username}", styles['Normal']),
            Paragraph(f"Thème : {soutenance.demande.theme}", styles['Normal']),
            Paragraph(f"Date : {soutenance.date_proposee}", styles['Normal']),
            Paragraph(f"Heure : {soutenance.heure_debut}", styles['Normal']),
            Paragraph(f"Salle : {soutenance.salle}", styles['Normal']),
            Spacer(1, 20),
            Paragraph("Merci de vous présenter 15 minutes avant l'heure indiquée.", styles['Normal']),
        ]
        doc.build(elements)
        buffer.seek(0)
        return buffer

    def _envoyer_convocations(self, soutenance):
        """Envoi des convocations par e-mail (SMTP configuré via .env). En
        l'absence de configuration SMTP, Django utilise le backend console en
        développement (les e-mails sont affichés dans les logs).

        Retourne (succes: bool, detail: str) pour permettre à l'administration
        de savoir si l'envoi a réellement abouti plutôt que d'échouer en
        silence (RG "Envoi des notifications par e-mail")."""
        try:
            destinataires = [soutenance.demande.etudiant.user.email]
            destinataires += [m.enseignant.user.email for m in soutenance.membres.all()]
            destinataires = [d for d in destinataires if d]
            if not destinataires:
                return False, "Aucune adresse e-mail valide trouvée pour ce dossier."
            pdf_buffer = self._generer_pdf_convocation(soutenance)
            email = EmailMessage(
                subject="Convocation à votre soutenance",
                body=(
                    f"Votre soutenance est planifiée le {soutenance.date_proposee} "
                    f"à {soutenance.heure_debut} en salle {soutenance.salle}."
                ),
                to=destinataires,
            )
            email.attach(f"convocation_{soutenance.id}.pdf", pdf_buffer.read(), 'application/pdf')
            # fail_silently=False : toute erreur SMTP remonte pour être journalisée
            # et signalée à l'administration plutôt que d'échouer sans trace.
            email.send(fail_silently=False)
            return True, f"Convocations envoyées à {len(destinataires)} destinataire(s)."
        except Exception as exc:
            logger.exception("Echec de l'envoi des convocations pour la soutenance #%s", soutenance.id)
            return False, f"Échec de l'envoi : {exc}"


class JuryViewSet(viewsets.ModelViewSet):
    serializer_class = JurySerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        return Jury.objects.select_related('enseignant__user', 'soutenance').all()
