/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../../../types';
import { api } from '../../../lib/axios';
import { storage } from '../../../lib/storage';
import { queryClient } from '../../../lib/queryClient';
import i18n from '../../../i18n';

const AUTH_LOGIN_PATH = (import.meta.env.VITE_AUTH_LOGIN_PATH || '/auth/login').trim();
const AUTH_ME_PATH = (import.meta.env.VITE_AUTH_ME_PATH || '/auth/me').trim();

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
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
      .get<User>(AUTH_ME_PATH)
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
      AUTH_LOGIN_PATH,
      { email, password },
    );
    storage.setToken(data.access_token);
    storage.setRefreshToken(data.refresh_token);
    storage.setUser(data.user);
    setToken(data.access_token);
    setUser(data.user);
    // Restore app language (landing page toggle is session-only)
    const savedLang = (localStorage.getItem('lh_lang') as 'pt' | 'en') ?? 'pt';
    i18n.changeLanguage(savedLang);
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
