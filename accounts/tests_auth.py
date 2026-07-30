from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model

User = get_user_model()

class AuthTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='test', password='pass123', role='etudiant')

    def test_login_obtient_token(self):
        response = self.client.post('/api/auth/login/', {'username': 'test', 'password': 'pass123'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_acces_api_sans_token_est_refuse(self):
        response = self.client.get('/api/demandes/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)