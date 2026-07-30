from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from demandes.models import Demande

User = get_user_model()


class MessagerieCanalFermeTest(APITestCase):
    def setUp(self):
        self.etudiant_user = User.objects.create_user(username='etu', password='test', role='etudiant')
        self.encadreur_user = User.objects.create_user(username='enc', password='test', role='encadreur')
        self.autre_encadreur_user = User.objects.create_user(username='enc2', password='test', role='encadreur')
        self.autre_etudiant_user = User.objects.create_user(username='etu2', password='test', role='etudiant')

        self.demande = Demande.objects.create(
            etudiant=self.etudiant_user.profil_etudiant,
            encadreur_souhaite=self.encadreur_user.profil_encadreur,
            encadreur_effectif=self.encadreur_user.profil_encadreur,
            theme='Sujet', entreprise='ACME', statut='acceptee',
        )

    def test_etudiant_peut_envoyer_message_a_son_encadreur(self):
        self.client.force_authenticate(user=self.etudiant_user)
        response = self.client.post('/api/messages/', {
            'demande': self.demande.id,
            'destinataire': self.encadreur_user.id,
            'contenu': 'Bonjour',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_etudiant_ne_peut_pas_ecrire_a_un_autre_encadreur(self):
        self.client.force_authenticate(user=self.etudiant_user)
        response = self.client.post('/api/messages/', {
            'demande': self.demande.id,
            'destinataire': self.autre_encadreur_user.id,
            'contenu': 'Bonjour',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_encadreur_ne_peut_pas_repondre_a_un_etudiant_hors_charge(self):
        self.client.force_authenticate(user=self.encadreur_user)
        response = self.client.post('/api/messages/', {
            'demande': self.demande.id,
            'destinataire': self.autre_etudiant_user.id,
            'contenu': 'Bonjour',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_encadreur_peut_repondre_a_son_etudiant(self):
        self.client.force_authenticate(user=self.encadreur_user)
        response = self.client.post('/api/messages/', {
            'demande': self.demande.id,
            'destinataire': self.etudiant_user.id,
            'contenu': 'Bien reçu',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
