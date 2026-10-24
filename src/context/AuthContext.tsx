import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/index.ts';
import { api, getStoredToken, setStoredToken } from '../lib/api.ts';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string) => Promise<void>;
  logout: () => void;
  updateUserPreferences: (preferences: any) => Promise<void>;
  updateUserName: (name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize auth
  useEffect(() => {
    async function initAuth() {
      const token = getStoredToken();
      if (!token) {
        // Automatically try logging in or registering a default demo user if desired,
        // or let user sign in. Let's create an intuitive experience: if no token,
        // create or log into a default account for instant exploration!
        try {
          // Attempt default login
          const res = await api.login({ email: 'demo@lifenote.ai', password: 'password123' });
          setStoredToken(res.token);
          setUser(res.user);
        } catch (e) {
          // If demo user doesn't exist yet, register it
          try {
            const regRes = await api.register({
              name: 'Julian Vance',
              email: 'demo@lifenote.ai',
              password: 'password123',
            });
            setStoredToken(regRes.token);
            setUser(regRes.user);
          } catch (regErr) {
            console.error('Initial guest registration error', regErr);
          }
        }
        setLoading(false);
        return;
      }

      try {
        const { user } = await api.getMe();
        setUser(user);
      } catch (err) {
        setStoredToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    initAuth();
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await api.login({ email, password: pass });
    setStoredToken(res.token);
    setUser(res.user);
  };

  const register = async (name: string, email: string, pass: string) => {
    const res = await api.register({ name, email, password: pass });
    setStoredToken(res.token);
    setUser(res.user);
  };

  const logout = () => {
    setStoredToken(null);
    setUser(null);
  };

  const updateUserPreferences = async (preferences: any) => {
    const res = await api.updateProfile({ preferences });
    setUser(res.user);
  };

  const updateUserName = async (name: string) => {
    const res = await api.updateProfile({ name });
    setUser(res.user);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateUserPreferences,
        updateUserName,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
