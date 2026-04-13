import axios from 'axios';
import { storage } from './storage';

const BASE_URL = (import.meta.env.VITE_API_URL || '/api').trim().replace(/\/+$/, '');
const AUTH_REFRESH_PATH = (import.meta.env.VITE_AUTH_REFRESH_PATH || '/auth/refresh').trim();

// ─── Refresh token queue ──────────────────────────────────────────────────────
// Evita múltiplas chamadas simultâneas ao endpoint de refresh.
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  failedQueue = [];
}

export const api = axios.create({
  baseURL: BASE_URL,
  // O Axios deteta automaticamente o Content-Type: application/json para objetos
  // e multipart/form-data para FormData. Definir aqui manualmente causa erros em uploads.
  headers: {},
  // NestJS espera chaves repetidas para arrays: platforms=A&platforms=B
  // O comportamento padrão do Axios seria platforms[]=A&platforms[]=B
  paramsSerializer: {
    serialize: (params: Record<string, unknown>) => {
      const sp = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null) continue;
        if (Array.isArray(value)) {
          value.forEach((v) => sp.append(key, String(v)));
        } else {
          sp.append(key, String(value));
        }
      }
      return sp.toString();
    },
  },
});

if (import.meta.env.DEV) {
  // Confirma a URL base usada em runtime. Em dev esta deve ser '/api' (Vite proxy → localhost:3000).
  console.info('[API] baseURL =', BASE_URL);
}

// Adiciona o token em cada pedido de forma segura
api.interceptors.request.use((config) => {
  const token = storage.getToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Trata erros globais: 401 → tenta renovar token; só redireciona se o refresh falhar
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (import.meta.env.DEV) {
      const cfg = error?.config as { baseURL?: string; url?: string; method?: string } | undefined;
      const method = (cfg?.method || 'GET').toUpperCase();
      const base = cfg?.baseURL || BASE_URL;
      const path = cfg?.url || '';
      console.error(`[API] ${method} ${base}${path} -> ${error.response?.status ?? 'ERR'}`);
    }

    const originalRequest = error.config as typeof error.config & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = storage.getRefreshToken();

      // Sem refresh token → logout imediato
      if (!refreshToken) {
        storage.clearAll();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      // Se já está a renovar, enfileira o pedido
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Usa axios direto para evitar que o interceptor entre em loop
        const { data } = await axios.post<{ access_token: string; refresh_token?: string }>(
          `${BASE_URL}${AUTH_REFRESH_PATH}`,
          { refreshToken },
        );

        storage.setToken(data.access_token);
        if (data.refresh_token) storage.setRefreshToken(data.refresh_token);
        api.defaults.headers.common.Authorization = `Bearer ${data.access_token}`;
        originalRequest.headers.Authorization = `Bearer ${data.access_token}`;

        processQueue(null, data.access_token);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        storage.clearAll();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);
