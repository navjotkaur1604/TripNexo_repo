import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('tripnexo_token') || '');
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('tripnexo_token')));

  const fetchCurrentUser = useCallback(async () => {
    const activeToken = localStorage.getItem('tripnexo_token');
    if (!activeToken) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const data = await authAPI.getMe();
      setUser(data.user);
    } catch {
      localStorage.removeItem('tripnexo_token');
      setToken('');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = async (credentials) => {
    const data = await authAPI.login(credentials);
    localStorage.setItem('tripnexo_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const register = async (payload) => {
    const data = await authAPI.register(payload);
    localStorage.setItem('tripnexo_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch {
      // Ignore network errors on stateless logout
    }
    localStorage.removeItem('tripnexo_token');
    setToken('');
    setUser(null);
  };

  const toggleFavorite = async (destinationId) => {
    const data = await authAPI.toggleFavorite(destinationId);
    setUser((prev) => (prev ? { ...prev, favorites: data.favorites } : prev));
    return data;
  };

  const refreshUser = fetchCurrentUser;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: Boolean(user && token),
        isAdmin: user?.role === 'admin',
        login,
        register,
        logout,
        toggleFavorite,
        setUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
