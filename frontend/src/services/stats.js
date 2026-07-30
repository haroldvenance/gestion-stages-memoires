import api from './api';

export const getStatsGlobal = () => api.get('/stats/global/');
export const getStatsEncadreur = () => api.get('/stats/encadreur/');
export const getStatsEtudiant = () => api.get('/stats/etudiant/');