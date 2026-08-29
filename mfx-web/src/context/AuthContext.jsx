import React, { createContext, useState, useContext, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import api from '../api/client';

// ====== SUPABASE CLIENT ======
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if credentials exist
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Please check your environment variables.');
}

// Create the supabase client
const supabaseClient = createClient(supabaseUrl || '', supabaseAnonKey || '');

// Export the supabase client for use in other hooks
export const supabase = supabaseClient;

// ====== AUTH CONTEXT ======
const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const role = localStorage.getItem('role');
    const user_id = localStorage.getItem('user_id');

    if (token && role && user_id) {
      setUser({ access_token: token, role, user_id });
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { access_token, role, user_id } = response.data;

      localStorage.setItem('access_token', access_token);
      localStorage.setItem('role', role);
      localStorage.setItem('user_id', user_id);

      setUser({ access_token, role, user_id });

      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Login failed',
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('role');
    localStorage.removeItem('user_id');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    isBuyer: user?.role === 'buyer',
    isShopOwner: user?.role === 'shop_owner',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};