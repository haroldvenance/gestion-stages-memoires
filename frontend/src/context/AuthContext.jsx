import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';
import { login as apiLogin, refreshToken as apiRefresh, logout as apiLogout, getMe } from '../services/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const access = localStorage.getItem('access');
      const refresh = localStorage.getItem('refresh');
      if (access && refresh) {
        try {
          // Tester si le token est valide en récupérant les infos utilisateur
          api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
          const userData = await getMe();
          setUser(userData);
        } catch (error) {
          // Token invalide → tentative de rafraîchissement
          try {
            const newToken = await apiRefresh(refresh);
            localStorage.setItem('access', newToken.access);
            api.defaults.headers.common['Authorization'] = `Bearer ${newToken.access}`;
            const userData = await getMe();
            setUser(userData);
          } catch {
            apiLogout();
          }
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (username, password) => {
    const data = await apiLogin(username, password);
    localStorage.setItem('access', data.access);
    localStorage.setItem('refresh', data.refresh);
    api.defaults.headers.common['Authorization'] = `Bearer ${data.access}`;
    const userData = await getMe();
    setUser(userData);
    return userData;
  };

  const logout = () => {
    apiLogout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;