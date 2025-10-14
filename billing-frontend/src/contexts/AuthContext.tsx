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
        console.log('No token found, user not authenticated');
        setAuthState({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }

      // Also set cookie for middleware
      document.cookie = `access_token=${token}; path=/; max-age=86400; SameSite=Lax`;

      console.log('Checking authentication...');
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Auth check timeout')), 5000)
      );
      
      const response = await Promise.race([
        authAPI.getMe(),
        timeoutPromise
      ]) as any;
      
      console.log('Auth check successful:', response.data);
      setAuthState({
        user: response.data,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      console.error('Auth check failed:', error);
      console.error('Error details:', error.response?.data || error.message);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      document.cookie = 'access_token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'refresh_token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
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

      // Also save to cookies for middleware
      document.cookie = `access_token=${access_token}; path=/; max-age=86400; SameSite=Lax`;
      document.cookie = `refresh_token=${refresh_token}; path=/; max-age=604800; SameSite=Lax`;

      // DON'T update React state - just redirect
      // The dashboard will load fresh and pick up auth from localStorage
      // This prevents double redirect issue
      window.location.href = '/admin/dashboard';
    } catch (error) {
      throw error;
    }
  };

  const register = async (data: { email: string; password: string; full_name: string; company_name?: string }) => {
    try {
      await authAPI.register(data);
      await login(data.email, data.password);
      router.push('/admin/dashboard');
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    
    // Also remove from cookies with multiple approaches to ensure they're cleared
    document.cookie = 'access_token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'refresh_token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'access_token=; path=/; domain=' + window.location.hostname + '; max-age=0';
    document.cookie = 'refresh_token=; path=/; domain=' + window.location.hostname + '; max-age=0';
    
    setAuthState({ user: null, isAuthenticated: false, isLoading: false });
    window.location.href = '/login';
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
