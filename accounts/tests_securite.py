from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class AccountsSecuriteTest(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(username='admin', password='motdepasse123', role='admin')
        self.encadreur_user = User.objects.create_user(username='enc', password='motdepasse123', role='encadreur')

    def test_login_retourne_un_token(self):
        response = self.client.post('/api/auth/login/', {
            'username': 'admin', 'password': 'motdepasse123',
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_login_echoue_avec_mauvais_mot_de_passe(self):
        response = self.client.post('/api/auth/login/', {
            'username': 'admin', 'password': 'faux',
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_seul_admin_peut_modifier_quota_encadreur(self):
        encadreur_id = self.encadreur_user.profil_encadreur.id

        self.client.force_authenticate(user=self.encadreur_user)
        response = self.client.patch(f'/api/encadreurs/{encadreur_id}/quota/', {'quota_max': 10})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(user=self.admin)
        response = self.client.patch(f'/api/encadreurs/{encadreur_id}/quota/', {'quota_max': 10})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.encadreur_user.profil_encadreur.refresh_from_db()
        self.assertEqual(self.encadreur_user.profil_encadreur.quota_max, 10)

    def test_changement_mot_de_passe(self):
        self.client.force_authenticate(user=self.encadreur_user)
        response = self.client.post('/api/auth/changer-mot-de-passe/', {
            'ancien_mot_de_passe': 'motdepasse123',
            'nouveau_mot_de_passe': 'NouveauMotDePasse456',
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_changement_mot_de_passe_refuse_si_ancien_incorrect(self):
        self.client.force_authenticate(user=self.encadreur_user)
        response = self.client.post('/api/auth/changer-mot-de-passe/', {
            'ancien_mot_de_passe': 'mauvais',
            'nouveau_mot_de_passe': 'NouveauMotDePasse456',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_utilisateur_non_admin_ne_peut_pas_lister_tous_les_comptes(self):
        self.client.force_authenticate(user=self.encadreur_user)
        response = self.client.get('/api/utilisateurs/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
