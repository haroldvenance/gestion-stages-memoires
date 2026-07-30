from datetime import date, time

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from demandes.models import Demande
from soutenances.models import Soutenance, Jury

User = get_user_model()


class PlanificationAutoTest(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(username='admin', password='test', role='admin')

        self.encadreurs = []
        for i in range(1, 4):
            user = User.objects.create_user(username=f'enc{i}', password='test', role='encadreur')
            self.encadreurs.append(user.profil_encadreur)

        self.demandes = []
        for i in range(1, 4):
            etu = User.objects.create_user(username=f'etu{i}', password='test', role='etudiant').profil_etudiant
            d = Demande.objects.create(
                etudiant=etu, encadreur_souhaite=self.encadreurs[0], encadreur_effectif=self.encadreurs[0],
                theme=f'Sujet {i}', entreprise='ACME', statut='acceptee',
            )
            d.eligible_soutenance = True
            d.save()
            self.demandes.append(d)

    def _payload(self, **overrides):
        payload = {
            'dates': [str(date(2026, 9, 1))],
            'salles': ['A101', 'A102'],
            'heure_debut': '08:00',
            'heure_fin': '12:00',
            'duree_heures': 1,
        }
        payload.update(overrides)
        return payload

    def test_planification_auto_cree_soutenances_et_jury_complet(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post('/api/soutenances/planifier_auto/', self._payload(), format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['planifiees']), 3)
        self.assertEqual(len(response.data['non_planifiees']), 0)

        for d in self.demandes:
            s = Soutenance.objects.get(demande=d)
            self.assertEqual(s.statut, 'proposee')
            membres = Jury.objects.filter(soutenance=s)
            self.assertEqual(membres.count(), 3)
            self.assertTrue(membres.filter(role_jury='rapporteur', enseignant=self.encadreurs[0]).exists())
            self.assertTrue(membres.filter(role_jury='president').exists())
            self.assertTrue(membres.filter(role_jury='examinateur').exists())
            # L'encadreur ne doit jamais être président (RG jury)
            self.assertFalse(
                membres.filter(role_jury='president', enseignant=self.encadreurs[0]).exists()
            )

    def test_aucun_double_booking_enseignant_sur_meme_creneau(self):
        self.client.force_authenticate(user=self.admin)
        self.client.post('/api/soutenances/planifier_auto/', self._payload(), format='json')

        # Chaque enseignant ne doit apparaître qu'une fois par créneau (date+heure)
        vus = set()
        for j in Jury.objects.select_related('soutenance').all():
            cle = (j.enseignant_id, j.soutenance.date_proposee, j.soutenance.heure_debut)
            self.assertNotIn(cle, vus)
            vus.add(cle)

    def test_dossier_non_eligible_est_ignore(self):
        etu = User.objects.create_user(username='etu_non_elig', password='test', role='etudiant').profil_etudiant
        Demande.objects.create(
            etudiant=etu, encadreur_souhaite=self.encadreurs[0], encadreur_effectif=self.encadreurs[0],
            theme='Non eligible', entreprise='ACME', statut='acceptee',
        )  # eligible_soutenance reste False

        self.client.force_authenticate(user=self.admin)
        response = self.client.post('/api/soutenances/planifier_auto/', self._payload(), format='json')
        planifies_ids = [p['demande_id'] for p in response.data['planifiees']]
        self.assertEqual(Soutenance.objects.filter(demande__etudiant=etu).count(), 0)

    def test_creneaux_insuffisants_produit_des_non_planifies(self):
        self.client.force_authenticate(user=self.admin)
        # Une seule salle, un seul créneau possible : au plus 1 soutenance planifiable.
        response = self.client.post('/api/soutenances/planifier_auto/', self._payload(
            salles=['A101'], heure_debut='08:00', heure_fin='09:00',
        ), format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['planifiees']), 1)
        self.assertEqual(len(response.data['non_planifiees']), 2)

    def test_encadreur_ne_peut_pas_lancer_la_planification_auto(self):
        self.client.force_authenticate(user=self.encadreurs[0].user)
        response = self.client.post('/api/soutenances/planifier_auto/', self._payload(), format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
