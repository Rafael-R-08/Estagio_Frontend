import { api } from '../lib/axios';
import type {
  User,
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
  SoftinsaLearningContent,
  CreateSoftinsaLearningDto,
  UpdateSoftinsaLearningDto,
  TrainingDocument,
  CertificateJob,
} from '../types';

// ─── Search ──────────────────────────────────────────────────────────────────

export const searchApi = {
  /** Novos embeddings Xenova (384D) */
  search: (q: string, limit = 10, platforms?: string[], isFree?: boolean, minRating?: number) =>
    api.get<SearchResponse>('/search/semantic', { params: { q, limit, platforms, isFree, minRating } }),

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

  trackAccess: (data: { externalId: string; title: string; url: string; platformId?: string }) =>
    api.post('/trainings/track-access', data),

  getPendingFeedback: () =>
    api.get<TrainingRecord[]>('/trainings/pending-feedback'),

  uploadDocument: (id: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post<TrainingDocument>(`/trainings/${id}/documents`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// ─── Certificates ─────────────────────────────────────────────────────────────

export const certificatesApi = {
  getAll: () => api.get<Certificate[]>('/certificates/me'),

  getExpiring: (days = 30) =>
    api.get<Certificate[]>('/certificates/expiring', { params: { days } }),

  getRenewalAlerts: () =>
    api.get<{
      expiringAlerts: { courseName: string; daysRemaining: number; message: string }[];
      staleKnowledgeSuggestions: { courseName: string; monthsSinceCompletion: number; message: string }[];
    }>('/certificates/renewal-alerts'),

  getById: (id: string) => api.get<Certificate>(`/certificates/${id}`),

  /** Retorna { jobId, status: 'PENDING' } */
  upload: (file: File, trainingId: string, meta?: Partial<UpdateCertificateDto>) => {
    const form = new FormData();
    form.append('file', file);
    form.append('trainingId', trainingId);
    if (meta?.courseName) form.append('courseName', meta.courseName);
    if (meta?.provider) form.append('provider', meta.provider);
    if (meta?.completionDate) form.append('completionDate', meta.completionDate);
    if (meta?.expirationDate) form.append('expirationDate', meta.expirationDate);
    if (meta?.durationHours !== undefined) form.append('durationHours', String(meta.durationHours));
    return api.post<CertificateJob>('/certificates', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /** Consulta estado do BullMQ */
  getJobStatus: (jobId: string) =>
    api.get<CertificateJob>(`/certificates/job/${jobId}`),

  update: (id: string, dto: UpdateCertificateDto) =>
    api.patch<Certificate>(`/certificates/${id}`, dto),

  reextract: (id: string) =>
    api.post<CertificateJob>(`/certificates/${id}/reextract`),

  delete: (id: string) => api.delete(`/certificates/${id}`),
};

// ─── Platforms (Admin) ────────────────────────────────────────────────────────

export const platformsApi = {
  getAll: () => api.get<LearningPlatform[]>('/admin/platforms'),

  create: (data: Partial<LearningPlatform>) =>
    api.post<LearningPlatform>('/admin/platforms', data),

  update: (id: string, data: Partial<LearningPlatform>) =>
    api.patch<LearningPlatform>(`/admin/platforms/${id}`, data),

  delete: (id: string) => api.delete(`/admin/platforms/${id}`),
};

// ─── Recommendations ─────────────────────────────────────────────────────────

export const recommendationsApi = {
  /** RAG atualizado */
  getForMe: () => api.get<RagResponse>('/recommendations/me'),

  /** JSON Welcome rápido */
  getWelcome: () => api.get<RagResponse>('/rag/welcome'),
};

// ─── AI (SSE handled in component) ───────────────────────────────────────────

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

// ─── Softinsa Everyday Learning ───────────────────────────────────────────────

export const softinsaLearningApi = {
  getAll: (params?: { department?: string; mandatory?: boolean }) =>
    api.get<SoftinsaLearningContent[]>('/softinsa-learning', { params }),

  getById: (id: string) =>
    api.get<SoftinsaLearningContent>(`/softinsa-learning/${id}`),

  create: (data: CreateSoftinsaLearningDto) =>
    api.post<SoftinsaLearningContent>('/softinsa-learning', data),

  update: (id: string, data: UpdateSoftinsaLearningDto) =>
    api.patch<SoftinsaLearningContent>(`/softinsa-learning/${id}`, data),

  delete: (id: string) =>
    api.delete(`/softinsa-learning/${id}`),
};
