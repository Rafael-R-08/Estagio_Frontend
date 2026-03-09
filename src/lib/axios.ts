import axios from 'axios';
import { storage } from './storage';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Se VITE_API_URL já incluir /api, não duplicar
const BASE_URL = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
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

// Adiciona o token em cada pedido
api.interceptors.request.use((config) => {
  const token = storage.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Trata erros globais: 401 → limpa sessão e redireciona
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      storage.clearAll();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);
