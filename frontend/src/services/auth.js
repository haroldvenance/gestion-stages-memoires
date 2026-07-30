import api from './api';

export const login = async (username, password) => {
  const response = await api.post('/auth/login/', { username, password });
  return response.data; // { access, refresh, role }
};

export const refreshToken = async (refresh) => {
  const response = await api.post('/auth/refresh/', { refresh });
  return response.data; // { access }
};

export const logout = () => {
  localStorage.removeItem('access');
  localStorage.removeItem('refresh');
  delete api.defaults.headers.common['Authorization'];
};

export const getMe = async () => {
  const response = await api.get('/auth/me/');
  return response.data;
};