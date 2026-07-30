import csv
import io

from django.db.models import Count, Q
from django.http import HttpResponse
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import ProfilEncadreur
from accounts.permissions import IsAdmin
from demandes.models import Demande
from entreprises.models import Entreprise
from soutenances.models import Soutenance


class DashboardView(APIView):
    """Indicateurs de pilotage pour l'administration (RG "Visualisation des
    indicateurs") : volumétrie des dossiers, répartition par filière, taux
    d'acceptation/refus, classement des encadreurs."""

    permission_classes = [IsAdmin]

    def get(self, request):
        demandes = Demande.objects.all()
        total = demandes.count()
        par_statut = dict(demandes.values_list('statut').annotate(n=Count('id')).order_by())
        par_filiere = list(
            demandes.values('etudiant__filiere')
            .annotate(total=Count('id'))
            .order_by('-total')
        )
        par_encadreur = list(
            demandes.filter(encadreur_effectif__isnull=False)
            .values('encadreur_effectif__user__username')
            .annotate(total=Count('id'))
            .order_by('-total')[:20]
        )
        acceptees = par_statut.get('acceptee', 0)
        refusees = par_statut.get('refusee', 0)
        traitees = acceptees + refusees
        taux_acceptation = round((acceptees / traitees) * 100, 1) if traitees else 0
        taux_refus = round((refusees / traitees) * 100, 1) if traitees else 0

        soutenances_par_statut = dict(
            Soutenance.objects.values_list('statut').annotate(n=Count('id')).order_by()
        )

        return Response({
            'total_demandes': total,
            'par_statut': par_statut,
            'par_filiere': par_filiere,
            'par_encadreur': par_encadreur,
            'taux_acceptation': taux_acceptation,
            'taux_refus': taux_refus,
            'total_entreprises_partenaires': Entreprise.objects.count(),
            'soutenances_par_statut': soutenances_par_statut,
        })


class QuotaConsoleView(APIView):
    """Tableau de bord temps réel de la charge de chaque encadreur (RG
    "Consultation des quotas et de la charge")."""

    permission_classes = [IsAdmin]

    def get(self, request):
        data = []
        for enc in ProfilEncadreur.objects.select_related('user').all():
            acceptes = enc.demandes_effectives.filter(statut='acceptee').count()
            en_attente = enc.demandes_souhaitees.filter(statut='en_attente').count()
            data.append({
                'id': enc.id,
                'nom': enc.user.get_full_name() or enc.user.username,
                'departement': enc.departement,
                'quota_max': enc.quota_max,
                'acceptes': acceptes,
                'en_attente': en_attente,
                'sature': acceptes >= enc.quota_max,
                'taux_charge': round((acceptes / enc.quota_max) * 100, 1) if enc.quota_max else 0,
            })
        return Response(data)


def _demandes_rows():
    header = ['ID', 'Étudiant', 'Filière', 'Thème', 'Encadreur souhaité',
              'Encadreur effectif', 'Entreprise', 'Statut', 'Date soumission']
    rows = [header]
    for d in Demande.objects.select_related(
        'etudiant__user', 'encadreur_souhaite__user', 'encadreur_effectif__user'
    ).all():
        rows.append([
            d.id,
            d.etudiant.user.get_full_name() or d.etudiant.user.username,
            d.etudiant.filiere,
            d.theme[:80],
            d.encadreur_souhaite.user.username if d.encadreur_souhaite else '',
            d.encadreur_effectif.user.username if d.encadreur_effectif else '',
            d.entreprise,
            d.get_statut_display(),
            d.date_soumission.strftime('%Y-%m-%d %H:%M'),
        ])
    return rows


class ExportDemandesView(APIView):
    """Export des listes globales de demandes en CSV, Excel ou PDF — réservé
    à l'administration (RG "Restreindre les exports de données")."""

    permission_classes = [IsAdmin]

    def get(self, request):
        fmt = request.query_params.get('format', 'csv').lower()
        rows = _demandes_rows()

        if fmt == 'xlsx':
            return self._export_xlsx(rows)
        if fmt == 'pdf':
            return self._export_pdf(rows)
        return self._export_csv(rows)

    def _export_csv(self, rows):
        response = HttpResponse(content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = 'attachment; filename="demandes.csv"'
        writer = csv.writer(response)
        for row in rows:
            writer.writerow(row)
        return response

    def _export_xlsx(self, rows):
        from openpyxl import Workbook
        from openpyxl.styles import Font

        wb = Workbook()
        ws = wb.active
        ws.title = 'Demandes'
        for i, row in enumerate(rows, start=1):
            ws.append(row)
            if i == 1:
                for cell in ws[1]:
                    cell.font = Font(bold=True)
        buffer = io.BytesIO()
        wb.save(buffer)
        buffer.seek(0)
        response = HttpResponse(
            buffer.read(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        )
        response['Content-Disposition'] = 'attachment; filename="demandes.xlsx"'
        return response

    def _export_pdf(self, rows):
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import landscape, A4
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=landscape(A4))
        table = Table(rows, repeatRows=1)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e3a8a')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTSIZE', (0, 0), (-1, -1), 7),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f1f5f9')]),
        ]))
        doc.build([table])
        buffer.seek(0)
        response = HttpResponse(buffer.read(), content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="demandes.pdf"'
        return response
