"""Planification automatique des soutenances.

RG "Planification manuelle ou automatique des dates de soutenance" : étant
donné une liste de dates, de salles et une plage horaire, ce module tente
de caser chaque dossier éligible (quitus obtenu, pas encore programmé) sur
un créneau libre, en respectant :

- l'absence de chevauchement dans une même salle ;
- l'absence de chevauchement pour un même enseignant (qu'il soit
  rapporteur, président ou examinateur d'une autre soutenance) ;
- le fait que l'encadreur de l'étudiant est automatiquement Rapporteur et
  ne peut pas être Président (RG "Rôle de l'encadreur dans le jury") ;
- une répartition équilibrée de la charge de jury entre enseignants
  (répartition « round robin » par nombre de participations déjà
  attribuées, y compris avant l'exécution de l'algorithme).

Les soutenances créées ont le statut "proposee" : elles doivent être
relues puis validées (une à une, ou individuellement) par l'administration
pour déclencher l'envoi des convocations — l'automatisation ne se
substitue donc pas à la décision finale, elle prépare une proposition de
planning cohérente.
"""
from datetime import datetime, timedelta, time as time_cls

from django.db import transaction

from accounts.models import ProfilEncadreur
from demandes.models import Demande
from .models import Soutenance, Jury


def _to_minutes(t: time_cls) -> int:
    return t.hour * 60 + t.minute


def _from_minutes(m: int) -> time_cls:
    return time_cls(hour=(m // 60) % 24, minute=m % 60)


def _intervals_overlap(a_start, a_end, b_start, b_end) -> bool:
    return a_start < b_end and b_start < a_end


def _build_slots(dates, salles, heure_debut, heure_fin, duree_heures):
    """Génère la grille de créneaux (date, salle, heure_debut) triée
    chronologiquement, salle par salle."""
    slots = []
    duree_min = int(duree_heures * 60)
    debut_min = _to_minutes(heure_debut)
    fin_min = _to_minutes(heure_fin)
    for date in sorted(dates):
        t = debut_min
        while t + duree_min <= fin_min:
            for salle in salles:
                slots.append((date, salle, _from_minutes(t)))
            t += duree_min
    return slots


def planifier_automatiquement(
    dates, salles, heure_debut, heure_fin, duree_heures=1, demande_ids=None,
):
    """Planifie automatiquement les soutenances des dossiers éligibles.

    Retourne un dict {'planifiees': [...], 'non_planifiees': [...]}.
    """
    duree_heures = float(duree_heures)
    slots = _build_slots(dates, salles, heure_debut, heure_fin, duree_heures)

    qs = Demande.objects.filter(eligible_soutenance=True, soutenance__isnull=True)
    if demande_ids:
        qs = qs.filter(id__in=demande_ids)
    demandes = list(qs.select_related('etudiant__user', 'encadreur_effectif').order_by('date_validation_finale'))

    enseignants = list(ProfilEncadreur.objects.select_related('user').all())
    charge = {enc.id: 0 for enc in enseignants}
    for j in Jury.objects.values_list('enseignant_id', flat=True):
        charge[j] = charge.get(j, 0) + 1

    # Réservations en mémoire (initialisées à partir de l'existant en base).
    salle_reservee = {}   # (date, salle) -> liste de (debut_min, fin_min)
    enseignant_reserve = {}  # (enseignant_id, date) -> liste de (debut_min, fin_min)

    for s in Soutenance.objects.all():
        debut = _to_minutes(s.heure_debut)
        fin = debut + int(s.duree_heures * 60)
        salle_reservee.setdefault((s.date_proposee, s.salle), []).append((debut, fin))
        for j in Jury.objects.filter(soutenance=s):
            enseignant_reserve.setdefault((j.enseignant_id, s.date_proposee), []).append((debut, fin))

    def salle_libre(date, salle, debut, fin):
        for d, f in salle_reservee.get((date, salle), []):
            if _intervals_overlap(debut, fin, d, f):
                return False
        return True

    def enseignant_libre(enc_id, date, debut, fin):
        for d, f in enseignant_reserve.get((enc_id, date), []):
            if _intervals_overlap(debut, fin, d, f):
                return False
        return True

    planifiees, non_planifiees = [], []

    for demande in demandes:
        rapporteur = demande.encadreur_effectif
        if rapporteur is None:
            non_planifiees.append({
                'demande_id': demande.id,
                'etudiant': demande.etudiant.user.get_full_name() or demande.etudiant.user.username,
                'raison': "Aucun encadreur effectif n'est associé à ce dossier.",
            })
            continue

        placed = False
        for date, salle, heure in slots:
            debut_min = _to_minutes(heure)
            fin_min = debut_min + int(duree_heures * 60)

            if not salle_libre(date, salle, debut_min, fin_min):
                continue
            if not enseignant_libre(rapporteur.id, date, debut_min, fin_min):
                continue

            candidats = [
                enc for enc in enseignants
                if enc.id != rapporteur.id and enseignant_libre(enc.id, date, debut_min, fin_min)
            ]
            if len(candidats) < 2:
                continue

            candidats.sort(key=lambda enc: charge.get(enc.id, 0))
            president, examinateur = candidats[0], candidats[1]

            try:
                with transaction.atomic():
                    soutenance = Soutenance.objects.create(
                        demande=demande, date_proposee=date, heure_debut=heure,
                        salle=salle, duree_heures=duree_heures, statut='proposee',
                    )
                    Jury.objects.create(soutenance=soutenance, enseignant=rapporteur, role_jury='rapporteur')
                    Jury.objects.create(soutenance=soutenance, enseignant=president, role_jury='president')
                    Jury.objects.create(soutenance=soutenance, enseignant=examinateur, role_jury='examinateur')
            except Exception as exc:  # noqa: BLE001 — on continue avec le créneau suivant
                continue

            salle_reservee.setdefault((date, salle), []).append((debut_min, fin_min))
            for enc in (rapporteur, president, examinateur):
                enseignant_reserve.setdefault((enc.id, date), []).append((debut_min, fin_min))
                charge[enc.id] = charge.get(enc.id, 0) + 1

            planifiees.append({
                'demande_id': demande.id,
                'soutenance_id': soutenance.id,
                'etudiant': demande.etudiant.user.get_full_name() or demande.etudiant.user.username,
                'date': str(date), 'heure': str(heure), 'salle': salle,
                'jury': {
                    'rapporteur': rapporteur.user.username,
                    'president': president.user.username,
                    'examinateur': examinateur.user.username,
                },
            })
            placed = True
            break

        if not placed:
            non_planifiees.append({
                'demande_id': demande.id,
                'etudiant': demande.etudiant.user.get_full_name() or demande.etudiant.user.username,
                'raison': "Aucun créneau disponible ne satisfait les contraintes de salle/jury.",
            })

    return {'planifiees': planifiees, 'non_planifiees': non_planifiees}
