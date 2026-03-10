import { api } from '../lib/axios';
import type {
  User,
  AuthResponse,
  CourseSearchResult,
  CourseDetail,
  SearchResponse,
  LearningPlatform,
  TrainingRecord,
  TrainingStats,
  CreateTrainingRecordDto,
  UpdateTrainingRecordDto,
  Certificate,
  UpdateCertificateDto,
  UpdateProfileDto,
  RagResponse,
  UserSettings,
  UpdateUserSettingsDto,
  AdminUser,
  UpdateUserRoleDto,
  AdminAnalytics,
} from '../types';

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),

  register: (name: string, email: string, password: string) =>
    api.post<AuthResponse>('/auth/register', { name, email, password }),

  me: () => api.get<User>('/auth/me'),

  refresh: (refreshToken: string) =>
    api.post<{ access_token: string }>('/auth/refresh', { refreshToken }),
};

// ─── User ─────────────────────────────────────────────────────────────────────

export const userApi = {
  getAll: () => api.get<User[]>('/user'),

  getById: (id: string) => api.get<User>(`/user/${id}`),

  updatePreferences: (platforms: string[]) =>
    api.patch('/user/preferences', { enabledPlatforms: platforms }),
};

// ─── Search ──────────────────────────────────────────────────────────────────

export const searchApi = {
  search: (q: string, limit = 10, platforms?: string[]) =>
    api.get<SearchResponse>('/search', { params: { q, limit, platforms } }),

  getPlatforms: () =>
    api.get<{ id: string; name: string; type: string }[]>('/search/platforms'),

  getCourse: (externalId: string) =>
    api.get<CourseDetail>(`/search/course/${encodeURIComponent(externalId)}`),

  getRelated: (externalId: string) =>
    api.get<CourseSearchResult[]>(`/search/course/${encodeURIComponent(externalId)}/related`),
};

// ─── Trainings ──────────────────────────────────────────────────────────────

export const trainingApi = {
  getAll: (params?: { status?: string; platformId?: string }) =>
    api.get<TrainingRecord[]>('/trainings/me', { params }),

  getStats: () => api.get<TrainingStats>('/trainings/me/stats'),

  getById: (id: string) => api.get<TrainingRecord>(`/trainings/${id}`),

  create: (dto: CreateTrainingRecordDto) =>
    api.post<TrainingRecord>('/trainings', dto),

  update: (id: string, dto: UpdateTrainingRecordDto) =>
    api.patch<TrainingRecord>(`/trainings/${id}`, dto),

  delete: (id: string) => api.delete(`/trainings/${id}`),
};

// ─── Certificates ─────────────────────────────────────────────────────────────

export const certificatesApi = {
  getAll: () => api.get<Certificate[]>('/certificates/me'),

  getExpiring: (days = 30) =>
    api.get<Certificate[]>('/certificates/expiring', { params: { days } }),

  getById: (id: string) => api.get<Certificate>(`/certificates/${id}`),

  upload: (file: File, trainingId: string, meta?: Partial<UpdateCertificateDto>) => {
    const form = new FormData();
    form.append('file', file);
    form.append('trainingId', trainingId);
    if (meta?.courseName) form.append('courseName', meta.courseName);
    if (meta?.provider) form.append('provider', meta.provider);
    if (meta?.completionDate) form.append('completionDate', meta.completionDate);
    if (meta?.expirationDate) form.append('expirationDate', meta.expirationDate);
    if (meta?.durationHours !== undefined) form.append('durationHours', String(meta.durationHours));
    return api.post<Certificate>('/certificates', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  update: (id: string, dto: UpdateCertificateDto) =>
    api.patch<Certificate>(`/certificates/${id}`, dto),

  reextract: (id: string) =>
    api.post<Certificate>(`/certificates/${id}/reextract`),

  delete: (id: string) => api.delete(`/certificates/${id}`),
};

// ─── Platforms (Admin) ────────────────────────────────────────────────────────

export const platformsApi = {
  getAll: () => api.get<LearningPlatform[]>('/platforms'),

  getById: (id: string) => api.get<LearningPlatform>(`/platforms/${id}`),

  create: (data: Partial<LearningPlatform>) =>
    api.post<LearningPlatform>('/platforms', data),

  update: (id: string, data: Partial<LearningPlatform>) =>
    api.patch<LearningPlatform>(`/platforms/${id}`, data),

  delete: (id: string) => api.delete(`/platforms/${id}`),
};

// ─── Recommendations ─────────────────────────────────────────────────────────

export const recommendationsApi = {
  getForMe: () => api.get<RagResponse>('/recommendations/me'),
  postForMe: (query: string) =>
    api.post<RagResponse>('/recommendations/me', { query }),
};

// ─── AI ──────────────────────────────────────────────────────────────────

export const aiApi = {
  generateText: (prompt: string) =>
    api.post<{ response: string }>('/ai/generate', { prompt }),

  searchChunks: (query: string, limit = 5) =>
    api.get<{ id: string; content: string; similarity: number }[]>('/ai/search-chunks', { params: { query, limit } }),
};

// ─── Profile ─────────────────────────────────────────────────────────────────

export const profileApi = {
  getMe: () => api.get<User>('/auth/me'),

  update: (dto: UpdateProfileDto) => api.patch<User>('/auth/me', dto),
};

// ─── Settings ────────────────────────────────────────────────────────────────

export const settingsApi = {
  get: () => api.get<UserSettings>('/auth/me/settings'),

  update: (dto: UpdateUserSettingsDto) =>
    api.patch<UserSettings>('/auth/me/settings', dto),
};

// ─── Admin ────────────────────────────────────────────────────────────────────

export const adminApi = {
  getUsers: () => api.get<AdminUser[]>('/admin/users'),

  updateUserRole: (id: string, dto: UpdateUserRoleDto) =>
    api.patch<AdminUser>(`/admin/users/${id}/role`, dto),

  deactivateUser: (id: string) =>
    api.patch<AdminUser>(`/admin/users/${id}/deactivate`),

  activateUser: (id: string) =>
    api.patch<AdminUser>(`/admin/users/${id}/activate`),

  getAnalytics: () => api.get<AdminAnalytics>('/admin/analytics'),
};
