/**
 * api.ts — Unified API layer
 *
 * Re-exports all named API namespaces used across the application.
 * Components import from '@/services/api' using named exports:
 *   import { trainingApi, searchApi, ... } from '@/services/api'
 */

import { api } from '../lib/axios';
import { storage } from '../lib/storage';
import type {
  User,
  UpdateProfileDto,
  AdminUser,
  UpdateUserRoleDto,
  AdminAnalytics,
  LearningPlatform,
  Certificate,
  UpdateCertificateDto,
  CertificateJob,
  CourseSearchResult,
  SearchResponse,
  TrainingRecord,
  TrainingStats,
  CreateTrainingRecordDto,
  UpdateTrainingRecordDto,
  TrainingResource,
  UserSettings,
  UpdateUserSettingsDto,
  RagResponse,
  AiChatResponse,
  AiConversation,
} from '../types';

// ─── Auth / Profile ───────────────────────────────────────────────────────────

export const profileApi = {
  getMe: () =>
    api.get<User>('/users/me'),

  update: (dto: UpdateProfileDto) =>
    api.patch<User>('/users/me', dto),
};

// ─── Admin — Users ────────────────────────────────────────────────────────────

export const adminApi = {
  getUsers: () =>
    api.get<AdminUser[]>('/admin/users'),

  updateUserRole: (id: string, dto: UpdateUserRoleDto) =>
    api.patch<AdminUser>(`/admin/users/${id}/role`, dto),

  deactivateUser: (id: string) =>
    api.patch<AdminUser>(`/admin/users/${id}/deactivate`),

  activateUser: (id: string) =>
    api.patch<AdminUser>(`/admin/users/${id}/activate`),

  getAnalytics: () =>
    api.get<AdminAnalytics>('/admin/analytics'),
};

// ─── Admin — Platforms ────────────────────────────────────────────────────────

export const platformsApi = {
  getAll: () =>
    api.get<LearningPlatform[]>('/admin/platforms'),

  create: (data: Partial<LearningPlatform>) =>
    api.post<LearningPlatform>('/admin/platforms', data),

  update: (id: string, data: Partial<LearningPlatform>) =>
    api.patch<LearningPlatform>(`/admin/platforms/${id}`, data),

  delete: (id: string) =>
    api.delete(`/admin/platforms/${id}`),
};

// ─── Certificates ─────────────────────────────────────────────────────────────

export const certificatesApi = {
  getAll: () =>
    api.get<Certificate[]>('/certificates/me'),

  getRenewalAlerts: () =>
    api.get<{
      expiringAlerts: { courseName: string; daysRemaining: number; message: string }[];
      staleKnowledgeSuggestions: { courseName: string; monthsSinceCompletion: number; message: string }[];
    }>('/certificates/renewal-alerts'),

  getById: (id: string) =>
    api.get<Certificate>(`/certificates/${id}`),

  upload: (file: File, trainingId: string, meta?: Partial<UpdateCertificateDto>) => {
    const form = new FormData();
    form.append('file', file);
    form.append('trainingId', trainingId);
    if (meta?.courseName) form.append('courseName', meta.courseName);
    if (meta?.provider) form.append('provider', meta.provider);
    if (meta?.completionDate) form.append('completionDate', meta.completionDate);
    if (meta?.expirationDate) form.append('expirationDate', meta.expirationDate);
    if (meta?.durationHours !== undefined) form.append('durationHours', String(meta.durationHours));
    return api.post<CertificateJob>('/certificates', form);
  },

  getJobStatus: (jobId: string) =>
    api.get<CertificateJob>(`/certificates/job/${jobId}`),

  update: (id: string, dto: UpdateCertificateDto) =>
    api.patch<Certificate>(`/certificates/${id}`, dto),

  reextract: (id: string) =>
    api.post<Certificate>(`/certificates/${id}/reextract`),

  delete: (id: string) =>
    api.delete(`/certificates/${id}`),
};

// ─── Training Records ─────────────────────────────────────────────────────────

export const trainingApi = {
  getAll: (params?: { status?: string }) =>
    api.get<TrainingRecord[] | { data: TrainingRecord[] }>('/trainings', { params }),

  getStats: () =>
    api.get<TrainingStats>('/trainings/stats'),

  getPendingFeedback: () =>
    api.get<TrainingRecord[]>('/trainings/pending-feedback'),

  create: (dto: CreateTrainingRecordDto) =>
    api.post<TrainingRecord>('/trainings', dto),

  update: (id: string, dto: Partial<UpdateTrainingRecordDto> & Record<string, unknown>) =>
    api.patch<TrainingRecord>(`/trainings/${id}`, dto),

  delete: (id: string) =>
    api.delete(`/trainings/${id}`),

  trackAccess: (data: { externalId: string; title: string; url: string; platformId: string }) =>
    api.post('/trainings/track-access', data),

  uploadDocument: (trainingId: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post(`/trainings/${trainingId}/documents`, form);
  },

  deleteDocument: (trainingId: string, docId: string) =>
    api.delete(`/trainings/${trainingId}/documents/${docId}`),

  createResource: (trainingId: string, data: FormData | Record<string, unknown>) =>
    api.post<TrainingResource>(`/trainings/${trainingId}/resources`, data),

  updateResource: (trainingId: string, resourceId: string, data: Record<string, unknown>) =>
    api.patch<TrainingResource>(`/trainings/${trainingId}/resources/${resourceId}`, data),

  deleteResource: (trainingId: string, resourceId: string) =>
    api.delete(`/trainings/${trainingId}/resources/${resourceId}`),

  addResourceFile: (trainingId: string, resourceId: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post(`/trainings/${trainingId}/resources/${resourceId}/files`, form);
  },

  deleteResourceFile: (trainingId: string, resourceId: string, fileId: string) =>
    api.delete(`/trainings/${trainingId}/resources/${resourceId}/files/${fileId}`),
};

// ─── Search ───────────────────────────────────────────────────────────────────

export const searchApi = {
  search: (
    q: string,
    limit?: number,
    platforms?: string[],
    isFree?: boolean,
    minInternalRating?: number,
    minRelevance?: number,
    level?: string,
    language?: string,
  ) =>
    api.get<SearchResponse>('/search', {
      params: { q, limit, platforms, isFree, minInternalRating, minRelevance, level, language },
    }),

  getCourse: (externalId: string) =>
    api.get<CourseSearchResult>(`/search/course/${externalId}`),

  getRelated: (externalId: string) =>
    api.get<CourseSearchResult[]>(`/search/course/${externalId}/related`),

  getPlatforms: () =>
    api.get<LearningPlatform[]>('/search/platforms'),
};

// ─── AI / Recommendations ─────────────────────────────────────────────────────

/**
 * Recommendations: POST /ai/recommendations
 * Response shape (Zod-validated, always 3 fields + metadata):
 *   { improvement, interests, missing_skills, metadata: { sourcesCount, qualityScore, timestamp } }
 */
export const recommendationsApi = {
  /** Personalised recommendations for the logged-in user */
  getForMe: () => {
    const token = storage.getToken();
    return api.post<RagResponse>('/ai/recommendations', {}, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
  },

  /** Welcome/greeting message on first AI assistant load */
  getWelcome: () => {
    const token = storage.getToken();
    return api.post<RagResponse>('/ai/recommendations/welcome', {}, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
  },
};

// ─── AI / Chat ────────────────────────────────────────────────────────────────

export const chatApi = {
  /**
   * Synchronous chat — POST /ai/chat
   * Body: { prompt, conversationId? }
   * Response: { query, answer, conversationId, qualityScore, sources }
   */
  send: (prompt: string, conversationId?: string) =>
    api.post<AiChatResponse>('/ai/chat', { prompt, conversationId }),

  /**
   * List all stored chat sessions for the current user — GET /ai/conversations
   */
  listConversations: () =>
    api.get<AiConversation[]>('/ai/conversations'),

  /**
   * Delete a stored chat session — DELETE /ai/conversations/:id
   */
  deleteConversation: (id: string) =>
    api.delete(`/ai/conversations/${id}`),
};

// ─── Settings ─────────────────────────────────────────────────────────────────

export const settingsApi = {
  get: () =>
    api.get<UserSettings>('/settings'),

  update: (dto: UpdateUserSettingsDto) =>
    api.patch<UserSettings>('/settings', dto),
};

