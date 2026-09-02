import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('qr_parky_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('qr_parky_token');
      if (token) {
        try {
          const res = await API.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.data);
            localStorage.setItem('qr_parky_user', JSON.stringify(res.data.data));
          }
        } catch (err) {
          logout();
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (email, password) => {
    const res = await API.post('/auth/login', { email, password });
    if (res.data.success) {
      const { token, refreshToken, user: userData } = res.data.data;
      localStorage.setItem('qr_parky_token', token);
      localStorage.setItem('qr_parky_refresh_token', refreshToken);
      localStorage.setItem('qr_parky_user', JSON.stringify(userData));
      setUser(userData);
      return userData;
    }
  };

  const logout = async () => {
    try {
      await API.post('/auth/logout');
    } catch (e) {
      // Ignore network errors on logout
    }
    localStorage.removeItem('qr_parky_token');
    localStorage.removeItem('qr_parky_refresh_token');
    localStorage.removeItem('qr_parky_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
