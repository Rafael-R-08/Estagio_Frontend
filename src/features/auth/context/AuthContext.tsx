/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../../../types';
import { api } from '../../../lib/axios';
import { storage } from '../../../lib/storage';
import { queryClient } from '../../../lib/queryClient';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

// ─── Context (exported so useAuth hook can import it) ───────────────────────

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => storage.getUser<User>());
  const [token, setToken] = useState<string | null>(() => storage.getToken());
  // isLoading começa como true se há token guardado (vamos validar com /auth/me)
  const [isLoading, setIsLoading] = useState(() => !!storage.getToken());

  // Valida o token ao carregar a app
  useEffect(() => {
    const savedToken = storage.getToken();
    if (!savedToken) return;

    api
      .get<User>('/auth/me')
      .then(({ data }) => {
        setUser(data);
        storage.setUser(data);
      })
      .catch(() => {
        // Token inválido ou expirado
        storage.clearAll();
        setUser(null);
        setToken(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post<{ access_token: string; refresh_token: string; user: User }>(
      '/auth/login',
      { email, password },
    );
    storage.setToken(data.access_token);
    storage.setRefreshToken(data.refresh_token);
    storage.setUser(data.user);
    setToken(data.access_token);
    setUser(data.user);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const { data } = await api.post<{ access_token: string; refresh_token: string; user: User }>(
      '/auth/register',
      { name, email, password },
    );
    storage.setToken(data.access_token);
    storage.setRefreshToken(data.refresh_token);
    storage.setUser(data.user);
    setToken(data.access_token);
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    storage.clearAll();
    setUser(null);
    setToken(null);
    queryClient.clear();
    window.location.href = '/login';
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
        setUser: (u: User) => {
          setUser(u);
          storage.setUser(u);
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// useAuth hook is in ../hooks/useAuth.ts to keep fast-refresh happy
