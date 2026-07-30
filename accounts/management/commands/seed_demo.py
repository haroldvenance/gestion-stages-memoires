from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from demandes.models import Demande
from entreprises.models import Entreprise

Utilisateur = get_user_model()


class Command(BaseCommand):
    help = "Crée des comptes et données de démonstration (admin, encadreurs, étudiants, demandes)."

    def handle(self, *args, **options):
        if not Utilisateur.objects.filter(username='admin').exists():
            admin = Utilisateur.objects.create_superuser(
                username='admin', email='admin@example.com', password='Admin1234!', role='admin'
            )
            self.stdout.write(self.style.SUCCESS(f"Admin créé : {admin.username} / Admin1234!"))

        encadreurs = []
        for i, (username, dept) in enumerate([
            ('kamga', 'Informatique'), ('mballa', 'Mathématiques'), ('njoya', 'Physique'),
        ], start=1):
            user, created = Utilisateur.objects.get_or_create(
                username=username, defaults={
                    'email': f'{username}@example.com', 'first_name': username.capitalize(),
                    'last_name': 'Encadreur', 'role': 'encadreur',
                }
            )
            if created:
                user.set_password('Encadreur1234!')
                user.save()
                user.profil_encadreur.departement = dept
                user.profil_encadreur.quota_max = 3
                user.profil_encadreur.save()
                self.stdout.write(self.style.SUCCESS(f"Encadreur créé : {username} / Encadreur1234!"))
            encadreurs.append(user.profil_encadreur)

        etudiants = []
        for i in range(1, 6):
            username = f'25S0{7400+i}'
            user, created = Utilisateur.objects.get_or_create(
                username=username, defaults={
                    'email': f'etudiant{i}@example.com', 'first_name': f'Etudiant{i}',
                    'last_name': 'Test', 'role': 'etudiant',
                }
            )
            if created:
                user.set_password('Etudiant1234!')
                user.save()
                user.profil_etudiant.numero_etudiant = username
                user.profil_etudiant.filiere = 'MIA' if i % 2 else 'Informatique'
                user.profil_etudiant.niveau = 'Master 2'
                user.profil_etudiant.save()
                self.stdout.write(self.style.SUCCESS(f"Étudiant créé : {username} / Etudiant1234!"))
            etudiants.append(user.profil_etudiant)

        for nom, ville in [('TechCorp SARL', 'Douala'), ('DataSoft', 'Yaoundé'), ('InnovLab', 'Douala')]:
            Entreprise.objects.get_or_create(nom=nom, defaults={'ville': ville})

        if etudiants and encadreurs and not Demande.objects.exists():
            Demande.objects.create(
                etudiant=etudiants[0], encadreur_souhaite=encadreurs[0],
                theme="Développement d'une plateforme de gestion académique",
                entreprise='TechCorp SARL', entreprise_ville='Douala',
            )
            Demande.objects.create(
                etudiant=etudiants[1], encadreur_souhaite=encadreurs[0],
                theme="Analyse de données pour la prédiction de rendement agricole",
                entreprise='DataSoft', entreprise_ville='Yaoundé',
            )
            self.stdout.write(self.style.SUCCESS("Demandes de démonstration créées."))

        self.stdout.write(self.style.SUCCESS("Jeu de données de démonstration prêt."))
