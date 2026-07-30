from django.test import TestCase
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from accounts.models import ProfilEtudiant, ProfilEncadreur
from demandes.models import Demande
from soutenances.models import PropositionCreneau, Soutenance, Jury

User = get_user_model()

class SoutenanceModelTest(TestCase):
    def setUp(self):
        self.admin_user = User.objects.create_user(username='admin', password='test', role='admin')
        self.etudiant_user = User.objects.create_user(username='etud', password='test', role='etudiant')
        self.encadreur_user = User.objects.create_user(username='enc', password='test', role='encadreur')
        self.etudiant = self.etudiant_user.profil_etudiant
        self.encadreur = self.encadreur_user.profil_encadreur
        self.demande = Demande.objects.create(
            etudiant=self.etudiant,
            encadreur_souhaite=self.encadreur,
            theme='IA'
        )
        self.proposition = PropositionCreneau.objects.create(
            demande=self.demande,
            encadreur=self.encadreur,
            date_proposee='2026-07-10',
            heure_debut='14:00',
            salle='Amphi A'
        )

    def test_creer_soutenance_a_partir_proposition(self):
        soutenance = Soutenance(
            demande=self.proposition.demande,
            date_proposee=self.proposition.date_proposee,
            heure_debut=self.proposition.heure_debut,
            salle=self.proposition.salle,
            statut='validee'
        )
        soutenance.full_clean()
        soutenance.save()
        self.assertEqual(Soutenance.objects.count(), 1)

    def test_chevauchement_de_salle_interdit(self):
        # Première soutenance
        Soutenance.objects.create(
            demande=self.demande,
            date_proposee='2026-07-10',
            heure_debut='14:00',
            salle='Amphi A',
            statut='validee'
        )
        # Deuxième demande avec un autre étudiant
        autre_etudiant_user = User.objects.create_user(username='etud2', password='test', role='etudiant')
        autre_etudiant = autre_etudiant_user.profil_etudiant
        autre_demande = Demande.objects.create(
            etudiant=autre_etudiant,
            encadreur_souhaite=self.encadreur,
            theme='Blockchain'
        )
        autre_soutenance = Soutenance(
            demande=autre_demande,
            date_proposee='2026-07-10',
            heure_debut='14:30',
            salle='Amphi A',
            statut='validee'
        )
        with self.assertRaises(ValidationError):
            autre_soutenance.full_clean()

    def test_soutenance_doit_avoir_president_et_rapporteur(self):
        soutenance = Soutenance.objects.create(
            demande=self.demande,
            date_proposee='2026-07-10',
            heure_debut='14:00',
            salle='Amphi A',
            statut='validee'
        )
        # Seulement un président
        Jury.objects.create(soutenance=soutenance, enseignant=self.encadreur, role_jury='president')
        soutenance.mention_provisoire = "Test"
        with self.assertRaises(ValidationError):
            soutenance.full_clean()
        # Ajout d'un rapporteur
        autre_enc = User.objects.create_user(username='enc2', password='test', role='encadreur').profil_encadreur
        Jury.objects.create(soutenance=soutenance, enseignant=autre_enc, role_jury='rapporteur')
        soutenance.save()  # plus d'erreur