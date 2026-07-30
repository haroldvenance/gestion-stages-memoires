import api from './api';

// Propositions
export const getPropositions = (demandeId) => {
  return api.get(`/demandes/${demandeId}/propositions/`);
};

export const createProposition = (demandeId, data) => {
  return api.post(`/demandes/${demandeId}/propositions/`, data);
};

export const deleteProposition = (id) => {
  return api.delete(`/propositions/${id}/`);
};

// Soutenances
export const getSoutenances = () => {
  return api.get('/soutenances/');
};

export const getSoutenance = (id) => {
  return api.get(`/soutenances/${id}/`);
};

export const createSoutenance = (data) => {
  return api.post('/soutenances/', data);
};

export const updateSoutenance = (id, data) => {
  return api.patch(`/soutenances/${id}/`, data);
};

export const genererPV = (soutenanceId) => {
  return api.post(`/soutenances/${soutenanceId}/generer_pv/`);
};

// Jury
export const getJury = (soutenanceId) => {
  return api.get(`/soutenances/${soutenanceId}/jury/`);
};

export const addJuryMember = (soutenanceId, data) => {
  return api.post(`/soutenances/${soutenanceId}/jury/`, data);
};

export const removeJuryMember = (id) => {
  return api.delete(`/jury/${id}/`);
};