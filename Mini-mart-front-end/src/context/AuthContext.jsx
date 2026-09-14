import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = sessionStorage.getItem('minimart_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.token) {
          const payload = JSON.parse(atob(parsed.token.split('.')[1]));
          if (payload.exp * 1000 < Date.now()) {
            sessionStorage.removeItem('minimart_user');
          } else {
            setUser(parsed);
          }
        } else {
          setUser(parsed);
        }
      } catch { sessionStorage.removeItem('minimart_user'); }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (username, password) => {
    const data = await api.login(username, password);
    const u = { ...data.user, token: data.token };
    setUser(u);
    sessionStorage.setItem('minimart_user', JSON.stringify(u));
    return u;
  }, []);

  const googleLogin = useCallback(async (credential) => {
    const data = await api.googleLogin(credential);
    const u = { ...data.user, token: data.token };
    setUser(u);
    sessionStorage.setItem('minimart_user', JSON.stringify(u));
    return u;
  }, []);

  const register = useCallback(async (username, password, role) => {
    const data = await api.register(username, password, role);
    const u = { ...data.user, token: data.token };
    setUser(u);
    sessionStorage.setItem('minimart_user', JSON.stringify(u));
    return u;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    sessionStorage.removeItem('minimart_user');
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, googleLogin, register, logout, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
