from django.test import TestCase
from django.contrib.auth import get_user_model
from accounts.models import ProfilEtudiant, ProfilEncadreur

User = get_user_model()

class UtilisateurModelTest(TestCase):
    def test_creation_etudiant_avec_profil(self):
        user = User.objects.create_user(username='etud1', password='pass', role='etudiant')
        # Le profil étudiant est créé automatiquement par signal
        self.assertTrue(hasattr(user, 'profil_etudiant'))
        self.assertEqual(user.profil_etudiant.user, user)

    def test_creation_encadreur_avec_profil(self):
        user = User.objects.create_user(username='enc1', password='pass', role='encadreur')
        self.assertTrue(hasattr(user, 'profil_encadreur'))

    def test_creation_admin_sans_profil(self):
        user = User.objects.create_user(username='admin1', password='pass', role='admin')
        self.assertFalse(hasattr(user, 'profil_etudiant'))
        self.assertFalse(hasattr(user, 'profil_encadreur'))