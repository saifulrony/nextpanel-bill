'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';
import { User, AuthState } from '@/types/auth';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; full_name: string; company_name?: string }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  
  // Initialize state by checking localStorage immediately
  const [authState, setAuthState] = useState<AuthState>(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      return {
        user: null,
        isAuthenticated: !!token,
        isLoading: true,
      };
    }
    return {
      user: null,
      isAuthenticated: false,
      isLoading: true,
    };
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        setAuthState({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }

      const response = await authAPI.getMe();
      setAuthState({
        user: response.data,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setAuthState({ user: null, isAuthenticated: false, isLoading: false });
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login({ email, password });
      const { access_token, refresh_token } = response.data;

      // Save tokens to localStorage
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);

      // DON'T update React state - just redirect
      // The dashboard will load fresh and pick up auth from localStorage
      // This prevents double redirect issue
      window.location.href = '/dashboard';
    } catch (error) {
      throw error;
    }
  };

  const register = async (data: { email: string; password: string; full_name: string; company_name?: string }) => {
    try {
      await authAPI.register(data);
      await login(data.email, data.password);
      router.push('/dashboard');
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setAuthState({ user: null, isAuthenticated: false, isLoading: false });
    router.push('/login');
  };

  const refreshUser = async () => {
    try {
      const response = await authAPI.getMe();
      setAuthState(prev => ({
        ...prev,
        user: response.data,
        isAuthenticated: true,
        isLoading: false,
      }));
    } catch (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
