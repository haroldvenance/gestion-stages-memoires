import api from './client'

export const authApi = {
  login: (username, password) => api.post('/auth/login/', { username, password }),
  me: () => api.get('/auth/me/'),
  updateMe: (data) => {
    const isFormData = data instanceof FormData
    return api.patch('/auth/me/', data, isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined)
  },
  changePassword: (payload) => api.post('/auth/changer-mot-de-passe/', payload),
}

export const demandesApi = {
  list: (params) => api.get('/demandes/', { params }),
  get: (id) => api.get(`/demandes/${id}/`),
  create: (data) => api.post('/demandes/', data),
  update: (id, data) => api.patch(`/demandes/${id}/`, data),
  accepter: (id) => api.post(`/demandes/${id}/accepter/`),
  refuser: (id, commentaire) => api.post(`/demandes/${id}/refuser/`, { commentaire }),
  reaffecter: (id, encadreur_id, commentaire) =>
    api.post(`/demandes/${id}/reaffecter/`, { encadreur_id, commentaire }),
  validerFinale: (id) => api.post(`/demandes/${id}/valider_finale/`),
}

export const documentsApi = {
  list: (params) => api.get('/documents/', { params }),
  upload: (formData) =>
    api.post('/documents/', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  annoter: (id, commentaire) => api.post(`/documents/${id}/annoter/`, { commentaire }),
}

export const messagesApi = {
  list: (demandeId) => api.get('/messages/', { params: { demande: demandeId } }),
  send: (data) => api.post('/messages/', data),
  marquerLus: (demandeId) => api.post('/messages/marquer_lus/', { demande: demandeId }),
}

export const encadreursApi = {
  list: () => api.get('/encadreurs/'),
  updateQuota: (id, quota_max) => api.patch(`/encadreurs/${id}/quota/`, { quota_max }),
}

export const utilisateursApi = {
  list: (params) => api.get('/utilisateurs/', { params }),
  create: (data) => api.post('/utilisateurs/', data),
  update: (id, data) => api.patch(`/utilisateurs/${id}/`, data),
  reset: (id) => api.post(`/utilisateurs/${id}/reinitialiser_mot_de_passe/`),
  desactiver: (id) => api.post(`/utilisateurs/${id}/desactiver/`),
  activer: (id) => api.post(`/utilisateurs/${id}/activer/`),
  importCsv: (formData) =>
    api.post('/utilisateurs/import_etudiants/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
}

export const entreprisesApi = {
  list: () => api.get('/entreprises/'),
  create: (data) => api.post('/entreprises/', data),
  update: (id, data) => api.patch(`/entreprises/${id}/`, data),
  remove: (id) => api.delete(`/entreprises/${id}/`),
}

export const soutenancesApi = {
  list: (params) => api.get('/soutenances/', { params }),
  get: (id) => api.get(`/soutenances/${id}/`),
  create: (data) => api.post('/soutenances/', data),
  update: (id, data) => api.patch(`/soutenances/${id}/`, data),
  valider: (id) => api.post(`/soutenances/${id}/valider/`),
  planifierAuto: (payload) => api.post('/soutenances/planifier_auto/', payload),
  telechargerConvocation: (id) => api.get(`/soutenances/${id}/telecharger_convocation/`, { responseType: 'blob' }),
  jury: {
    list: () => api.get('/jury/'),
    create: (data) => api.post('/jury/', data),
    remove: (id) => api.delete(`/jury/${id}/`),
  },
}

export const statistiquesApi = {
  dashboard: () => api.get('/statistiques/dashboard/'),
  quotas: () => api.get('/statistiques/quotas/'),
  exportDemandes: (format) =>
    api.get('/statistiques/export/demandes/', { params: { format }, responseType: 'blob' }),
}

export const auditApi = {
  list: (params) => api.get('/audit-logs/', { params }),
}
