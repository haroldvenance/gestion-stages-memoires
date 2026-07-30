from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from entreprises.models import Entreprise

User = get_user_model()


class EntrepriseCrudTest(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(username='admin', password='test', role='admin')
        self.etudiant = User.objects.create_user(username='etu', password='test', role='etudiant')
        self.entreprise = Entreprise.objects.create(nom='ACME Corp', ville='Douala')

    def test_lecture_ouverte_a_tout_utilisateur_authentifie(self):
        self.client.force_authenticate(user=self.etudiant)
        response = self.client.get('/api/entreprises/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_creation_reservee_a_admin(self):
        self.client.force_authenticate(user=self.etudiant)
        response = self.client.post('/api/entreprises/', {'nom': 'NouvelleSociete'})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(user=self.admin)
        response = self.client.post('/api/entreprises/', {'nom': 'NouvelleSociete'})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_lecture_refusee_sans_authentification(self):
        response = self.client.get('/api/entreprises/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
