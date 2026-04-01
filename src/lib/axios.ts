import axios from 'axios';
import { storage } from './storage';

const BASE_URL = (import.meta.env.VITE_API_URL || '/api').trim().replace(/\/+$/, '');

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

// Trata erros globais: 401 → limpa sessão e redireciona
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

    if (error.response?.status === 401) {
      storage.clearAll();
      window.location.href = '/login';
    }


    return Promise.reject(error);

    return Promise.reject(error);
  },
);
