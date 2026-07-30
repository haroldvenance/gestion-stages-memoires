import logging

from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger('app')


def custom_exception_handler(exc, context):
    """Encapsule le gestionnaire d'exceptions par défaut de DRF pour garantir
    qu'aucune trace technique (stack trace, requête SQL, chemin serveur) ne
    fuite vers le client — conformément à l'exigence "Messages d'erreur
    explicites" sans divulguer d'information sensible.
    """
    response = exception_handler(exc, context)

    if response is not None:
        return response

    # Exception non gérée par DRF (ex: erreur interne) : on journalise le
    # détail côté serveur et on renvoie un message générique au client.
    request = context.get('request')
    logger.error(
        "Erreur non gérée sur %s: %s",
        getattr(request, 'path', 'inconnu'), exc, exc_info=True,
    )
    return Response(
        {'detail': "Une erreur interne est survenue. Veuillez réessayer plus tard."},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )
