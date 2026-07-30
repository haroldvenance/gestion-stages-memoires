import api from './api';

/**
 * Récupère tous les messages d'une demande spécifique.
 * @param {number} demandeId - L'identifiant de la demande.
 * @returns {Promise} - La réponse de l'API.
 */
export const getMessages = (demandeId) => {
  return api.get(`/messages/?demande_id=${demandeId}`);
};

/**
 * Envoie un nouveau message.
 * @param {Object} data - Les données du message (demande, destinataire, contenu).
 * @returns {Promise} - La réponse de l'API.
 */
export const sendMessage = (data) => {
  return api.post('/messages/', data);
};

/**
 * Marque un message comme lu.
 * @param {number} messageId - L'identifiant du message.
 * @returns {Promise} - La réponse de l'API.
 */
export const markAsRead = (messageId) => {
  return api.patch(`/messages/${messageId}/read/`);
};

/**
 * Récupère la liste des conversations (messages par demande) – optionnel.
 * @returns {Promise} - Liste des messages groupés.
 */
export const getConversations = () => {
  return api.get('/messages/');
};