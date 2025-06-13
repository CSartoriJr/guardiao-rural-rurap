'use client';
import type { User } from '@/types';
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { mockUsers } from '@/lib/mockData'; // For mock login

interface AuthContextType {
  user: User | null;
  loading: boolean;
  initializing: boolean; // To track initial auth state loading from localStorage
  login: (email: string, role: 'farmer' | 'technician') => Promise<User | null>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'cacabruxa-user';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [initializing, setInitializing] = useState<boolean>(true);

  useEffect(() => {
    // Check for saved user in localStorage on initial load
    const savedUser = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setInitializing(false);
  }, []);

  const login = async (email: string, role: 'farmer' | 'technician'): Promise<User | null> => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    const foundUser = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase() && u.role === role);
    
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(foundUser));
      setLoading(false);
      return foundUser;
    }
    setLoading(false);
    return null;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, loading, initializing, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
