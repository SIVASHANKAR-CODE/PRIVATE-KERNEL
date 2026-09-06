import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/index.js';
import { apiRequest } from '../services/api.js';
import { initSocket, disconnectSocket } from '../services/socket.js';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (emailOrUsername: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: {
    name: string;
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) => Promise<{ success: boolean; error?: string; message?: string }>;
  logout: () => Promise<void>;
  updateUser: (updatedData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('pk_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Check current session on mount ONLY.
  // We read the token directly from localStorage here so we don't need
  // [token] in the deps, which would cause a double /api/auth/me call
  // every time setToken() is called (e.g. after login).
  useEffect(() => {
    const storedToken = localStorage.getItem('pk_token');

    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    const fetchMe = async () => {
      try {
        const res = await apiRequest<{ user: User }>('/api/auth/me');
        if (res.success && res.data?.user) {
          setUser(res.data.user);
          setToken(storedToken);
          initSocket(storedToken);
        } else {
          // Token is invalid or expired — clear everything
          localStorage.removeItem('pk_token');
          sessionStorage.clear();
          setToken(null);
          setUser(null);
          disconnectSocket();
        }
      } catch (error) {
        console.error('Auth verification error:', error);
        // On network error, clear token so user must re-login
        localStorage.removeItem('pk_token');
        sessionStorage.clear();
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only on mount — logout uses window.location.href (full reload)

  const login = async (emailOrUsername: string, password: string) => {
    const res = await apiRequest<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ emailOrUsername, password })
    });

    if (res.success && res.data) {
      localStorage.setItem('pk_token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      initSocket(res.data.token);
      return { success: true };
    }

    return {
      success: false,
      error: res.error?.message || 'Login failed. Please check your credentials.'
    };
  };

  const register = async (data: {
    name: string;
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) => {
    const res = await apiRequest<{ message: string; isEmailVerified: boolean }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });

    if (res.success && res.data) {
      return { success: true, message: res.data.message };
    }

    return {
      success: false,
      error: res.error?.message || 'Registration failed.'
    };
  };

  const logout = async () => {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' });
    } finally {
      localStorage.removeItem('pk_token');
      sessionStorage.clear();
      setToken(null);
      setUser(null);
      disconnectSocket();
      window.location.href = '/login';
    }
  };

  const updateUser = (updatedData: Partial<User>) => {
    setUser(prev => (prev ? { ...prev, ...updatedData } : null));
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
