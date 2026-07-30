from django.conf import settings
from django.core.mail import send_mail
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = (
        "Envoie un e-mail de test pour vérifier la configuration SMTP "
        "(EMAIL_HOST, EMAIL_PORT, EMAIL_HOST_USER, EMAIL_HOST_PASSWORD dans .env)."
    )

    def add_arguments(self, parser):
        parser.add_argument('destinataire', type=str, help="Adresse e-mail de destination du test.")

    def handle(self, *args, **options):
        destinataire = options['destinataire']
        self.stdout.write(f"Backend d'e-mail actif : {settings.EMAIL_BACKEND}")
        if 'console' in settings.EMAIL_BACKEND:
            self.stdout.write(self.style.WARNING(
                "Le backend console est actif (DEBUG=True ou EMAIL_BACKEND non configuré) : "
                "l'e-mail sera affiché ci-dessous plutôt que réellement envoyé."
            ))
        try:
            send_mail(
                subject="Test — Plateforme de gestion des stages et mémoires",
                message=(
                    "Ceci est un e-mail de test envoyé depuis la commande "
                    "`manage.py test_email`. Si vous le recevez, la configuration "
                    "SMTP est fonctionnelle."
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[destinataire],
                fail_silently=False,
            )
        except Exception as exc:
            raise CommandError(f"Échec de l'envoi : {exc}")

        self.stdout.write(self.style.SUCCESS(f"E-mail de test envoyé à {destinataire}."))
