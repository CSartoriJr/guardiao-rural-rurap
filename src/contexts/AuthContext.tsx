
'use client';
import type { User } from '@/types';
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { mockUsers } from '@/lib/mockData'; // For mock login

interface AuthContextType {
  user: User | null;
  loading: boolean;
  initializing: boolean; // To track initial auth state loading from localStorage
  login: (cpf: string, password: string) => Promise<User | null>; // Changed email and role to cpf and password
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

  const login = async (cpf: string, password: string): Promise<User | null> => { // Password is still mock
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Normalize CPF: remove dots and dashes for comparison if stored that way, or ensure input is normalized
    const normalizedCpf = cpf.replace(/[.-]/g, ''); 
    
    const foundUser = mockUsers.find(
      u => u.cpf.replace(/[.-]/g, '').toLowerCase() === normalizedCpf.toLowerCase()
    );
    
    if (foundUser) {
      // In a real app, you'd verify the password here
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
