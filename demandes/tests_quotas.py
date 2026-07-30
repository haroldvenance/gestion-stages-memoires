from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import ProfilEncadreur, ProfilEtudiant
from demandes.models import Demande

User = get_user_model()


class QuotaEtReaffectationTest(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(username='admin', password='test', role='admin')
        self.encadreur_user = User.objects.create_user(username='enc1', password='test', role='encadreur')
        self.encadreur = self.encadreur_user.profil_encadreur
        self.encadreur.quota_max = 1
        self.encadreur.save()

        self.encadreur2_user = User.objects.create_user(username='enc2', password='test', role='encadreur')
        self.encadreur2 = self.encadreur2_user.profil_encadreur

        self.etudiant1 = User.objects.create_user(username='etu1', password='test', role='etudiant').profil_etudiant
        self.etudiant2 = User.objects.create_user(username='etu2', password='test', role='etudiant').profil_etudiant

    def _creer_demande(self, etudiant, encadreur):
        return Demande.objects.create(
            etudiant=etudiant, encadreur_souhaite=encadreur,
            theme='Sujet', entreprise='ACME',
        )

    def test_encadreur_sature_ne_peut_plus_accepter(self):
        demande1 = self._creer_demande(self.etudiant1, self.encadreur)
        demande2 = self._creer_demande(self.etudiant2, self.encadreur)

        self.client.force_authenticate(user=self.encadreur_user)
        r1 = self.client.post(f'/api/demandes/{demande1.id}/accepter/')
        self.assertEqual(r1.status_code, status.HTTP_200_OK)

        # Le quota (1) est atteint : la seconde acceptation doit être bloquée.
        r2 = self.client.post(f'/api/demandes/{demande2.id}/accepter/')
        self.assertEqual(r2.status_code, status.HTTP_400_BAD_REQUEST)

    def test_soumission_bloquee_vers_encadreur_sature(self):
        demande1 = self._creer_demande(self.etudiant1, self.encadreur)
        self.client.force_authenticate(user=self.encadreur_user)
        self.client.post(f'/api/demandes/{demande1.id}/accepter/')

        # Un autre étudiant tente de soumettre vers le même encadreur (saturé)
        self.client.force_authenticate(user=self.etudiant2.user)
        response = self.client.post('/api/demandes/', {
            'theme': 'Autre sujet', 'encadreur_souhaite': self.encadreur.id, 'entreprise': 'ACME',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_refus_sans_commentaire_est_rejete(self):
        demande = self._creer_demande(self.etudiant1, self.encadreur)
        self.client.force_authenticate(user=self.encadreur_user)
        response = self.client.post(f'/api/demandes/{demande.id}/refuser/', {'commentaire': ''})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_admin_reaffecte_demande_vers_encadreur_disponible(self):
        demande = self._creer_demande(self.etudiant1, self.encadreur)
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(f'/api/demandes/{demande.id}/reaffecter/', {
            'encadreur_id': self.encadreur2.id, 'commentaire': 'Equilibrage de charge',
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        demande.refresh_from_db()
        self.assertEqual(demande.encadreur_effectif, self.encadreur2)
        self.assertTrue(demande.reaffectee_par_admin)
        self.assertEqual(demande.statut, 'acceptee')

    def test_encadreur_ne_peut_pas_reaffecter(self):
        demande = self._creer_demande(self.etudiant1, self.encadreur)
        self.client.force_authenticate(user=self.encadreur_user)
        response = self.client.post(f'/api/demandes/{demande.id}/reaffecter/', {
            'encadreur_id': self.encadreur2.id,
        })
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_demande_acceptee_non_modifiable_par_etudiant(self):
        demande = self._creer_demande(self.etudiant1, self.encadreur)
        self.client.force_authenticate(user=self.encadreur_user)
        self.client.post(f'/api/demandes/{demande.id}/accepter/')

        self.client.force_authenticate(user=self.etudiant1.user)
        response = self.client.patch(f'/api/demandes/{demande.id}/', {'theme': 'Nouveau thème'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_quitus_rend_eligible_a_la_soutenance(self):
        demande = self._creer_demande(self.etudiant1, self.encadreur)
        self.client.force_authenticate(user=self.encadreur_user)
        self.client.post(f'/api/demandes/{demande.id}/accepter/')
        response = self.client.post(f'/api/demandes/{demande.id}/valider_finale/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        demande.refresh_from_db()
        self.assertTrue(demande.eligible_soutenance)
