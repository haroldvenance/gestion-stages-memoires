from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from accounts.models import ProfilEtudiant, ProfilEncadreur
from demandes.models import Demande, Document

User = get_user_model()

class DemandeAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        # Créer utilisateurs
        self.etudiant_user = User.objects.create_user(username='etud', password='test', role='etudiant')
        self.encadreur_user = User.objects.create_user(username='enc', password='test', role='encadreur')
        self.admin_user = User.objects.create_user(username='admin', password='test', role='admin')
        # Profils
        self.etudiant_profil = self.etudiant_user.profil_etudiant
        self.encadreur_profil = self.encadreur_user.profil_encadreur
        self.encadreur_profil.departement = 'Informatique'
        self.encadreur_profil.save()
        # Données de demande
        self.demande_data = {
            'etudiant': self.etudiant_profil.id,
            'encadreur_souhaite': self.encadreur_profil.id,
            'theme': 'IA en agriculture',
            'entreprise': 'ACME Corp',
        }

    def test_etudiant_peut_creer_demande(self):
        self.client.force_authenticate(user=self.etudiant_user)
        response = self.client.post('/api/demandes/', self.demande_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Demande.objects.count(), 1)
        demande = Demande.objects.first()
        self.assertEqual(demande.theme, 'IA en agriculture')
        self.assertEqual(demande.statut, 'en_attente')

    def test_etudiant_ne_peut_pas_avoir_deux_demandes_actives(self):
        self.client.force_authenticate(user=self.etudiant_user)
        # Première demande
        response1 = self.client.post('/api/demandes/', self.demande_data, format='json')
        self.assertEqual(response1.status_code, status.HTTP_201_CREATED)
        # Deuxième demande
        response2 = self.client.post('/api/demandes/', self.demande_data, format='json')
        self.assertEqual(response2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('demande en cours', str(response2.data))

    def test_encadreur_peut_accepter_demande(self):
        demande = Demande.objects.create(
            etudiant=self.etudiant_profil,
            encadreur_souhaite=self.encadreur_profil,
            theme='IA'
        )
        self.client.force_authenticate(user=self.encadreur_user)
        url = f'/api/demandes/{demande.id}/accepter/'
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        demande.refresh_from_db()
        self.assertEqual(demande.statut, 'acceptee')
        self.assertEqual(demande.encadreur_effectif, self.encadreur_profil)
        self.assertIsNotNone(demande.date_reponse)

    def test_encadreur_peut_refuser_demande_avec_commentaire(self):
        demande = Demande.objects.create(
            etudiant=self.etudiant_profil,
            encadreur_souhaite=self.encadreur_profil,
            theme='IA'
        )
        self.client.force_authenticate(user=self.encadreur_user)
        url = f'/api/demandes/{demande.id}/refuser/'
        response = self.client.post(url, {'commentaire': 'Thème hors sujet'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        demande.refresh_from_db()
        self.assertEqual(demande.statut, 'refusee')
        self.assertEqual(demande.commentaire_encadreur, 'Thème hors sujet')

    def test_etudiant_voit_ses_propres_demandes(self):
        demande1 = Demande.objects.create(
            etudiant=self.etudiant_profil,
            encadreur_souhaite=self.encadreur_profil,
            theme='IA'
        )
        demande1.statut = 'refusee'
        demande1.save()
        demande2 = Demande.objects.create(
            etudiant=self.etudiant_profil,
            encadreur_souhaite=self.encadreur_profil,
            theme='Blockchain'
        )
        self.client.force_authenticate(user=self.etudiant_user)
        response = self.client.get('/api/demandes/')
        self.assertEqual(len(response.data['results']), 2)

    def test_encadreur_voit_uniquement_ses_demandes_souhaitees(self):
        # Demande pour cet encadreur
        Demande.objects.create(etudiant=self.etudiant_profil, encadreur_souhaite=self.encadreur_profil, theme='IA')
        # Autre encadreur
        autre_enc = User.objects.create_user(username='enc2', password='test', role='encadreur')
        autre_profil = autre_enc.profil_encadreur
        autre_profil.departement = 'Maths'
        autre_profil.save()
        # Autre étudiant pour éviter le blocage de demande active
        autre_etudiant = User.objects.create_user(username='etud2', password='test', role='etudiant')
        autre_etudiant_profil = autre_etudiant.profil_etudiant
        Demande.objects.create(etudiant=autre_etudiant_profil, encadreur_souhaite=autre_profil, theme='Algèbre')
        self.client.force_authenticate(user=self.encadreur_user)
        response = self.client.get('/api/demandes/')
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['theme'], 'IA')


class DocumentAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.etudiant_user = User.objects.create_user(username='etud', password='test', role='etudiant')
        self.encadreur_user = User.objects.create_user(username='enc', password='test', role='encadreur')
        self.etudiant_profil = self.etudiant_user.profil_etudiant
        self.encadreur_profil = self.encadreur_user.profil_encadreur
        self.demande = Demande.objects.create(
            etudiant=self.etudiant_profil,
            encadreur_souhaite=self.encadreur_profil,
            theme='IA'
        )

    def test_etudiant_peut_uploader_document(self):
        self.client.force_authenticate(user=self.etudiant_user)
        from django.core.files.uploadedfile import SimpleUploadedFile
        fichier = SimpleUploadedFile("test.pdf", b"contenu", content_type="application/pdf")
        data = {
            'demande': self.demande.id,
            'fichier': fichier,
            'type_doc': 'brouillon'
        }
        response = self.client.post('/api/documents/', data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Document.objects.count(), 1)
        self.assertEqual(Document.objects.first().version, 1)

    def test_document_trop_gros_est_refuse(self):
        self.client.force_authenticate(user=self.etudiant_user)
        from django.core.files.uploadedfile import SimpleUploadedFile
        fichier = SimpleUploadedFile("large.pdf", b"x" * (16 * 1024 * 1024), content_type="application/pdf")
        data = {
            'demande': self.demande.id,
            'fichier': fichier,
            'type_doc': 'brouillon'
        }
        response = self.client.post('/api/documents/', data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('15 Mo', str(response.data))