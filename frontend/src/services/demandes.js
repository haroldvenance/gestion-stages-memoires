import api from './api';

// Demandes
export const getDemandes = () => api.get('/demandes/');
export const getDemande = (id) => api.get(`/demandes/${id}/`);
export const createDemande = (data) => api.post('/demandes/', data);
export const accepterDemande = (id) => api.post(`/demandes/${id}/accepter/`);
export const refuserDemande = (id, commentaire) => api.post(`/demandes/${id}/refuser/`, { commentaire });

// Documents
export const getDocuments = (demandeId) => api.get(`/demandes/${demandeId}/documents/`);
export const uploadDocument = (demandeId, data) => {
  const formData = new FormData();
  Object.keys(data).forEach(key => formData.append(key, data[key]));
  return api.post(`/demandes/${demandeId}/documents/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};