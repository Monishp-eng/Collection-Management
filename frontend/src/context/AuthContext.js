import React, { createContext, useContext, useEffect, useState } from 'react';
import { authAPI } from '../api/api';

const AuthContext = createContext(null);

const readStoredUser = () => {
  try {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('token')));

  useEffect(() => {
    const handleExpired = () => {
      setUser(null);
      setToken(null);
      setLoading(false);
    };

    window.addEventListener('auth:expired', handleExpired);
    return () => window.removeEventListener('auth:expired', handleExpired);
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await authAPI.me();
        const nextUser = response.data.user;
        setUser(nextUser);
        localStorage.setItem('user', JSON.stringify(nextUser));
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, [token]);

  const persistSession = (nextToken, nextUser) => {
    setToken(nextToken);
    setUser(nextUser);
    localStorage.setItem('token', nextToken);
    localStorage.setItem('user', JSON.stringify(nextUser));
  };

  const login = async (credentials) => {
    const response = await authAPI.login(credentials);
    persistSession(response.data.token, response.data.user);
    return response.data.user;
  };

  const register = async (credentials) => {
    const response = await authAPI.register(credentials);
    return response.data;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: Boolean(user && token),
    login,
    register,
    logout,
    setUser: (nextUser) => {
      setUser(nextUser);
      localStorage.setItem('user', JSON.stringify(nextUser));
    }
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}