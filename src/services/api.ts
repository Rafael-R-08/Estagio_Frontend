/**
 * api.ts — Unified API layer
 *
 * Re-exports all named API namespaces used across the application.
 * Components import from '@/services/api' using named exports:
 *   import { trainingApi, searchApi, ... } from '@/services/api'
 */

import { api } from '../lib/axios';
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
  RagResponse as _RagResponse, // kept for chat response compatibility
  RecommendationResponse,
  WelcomeResponse,
  AiChatResponse,
  AiConversation,
  MentionableCourse,
  CoursePlanResponse,
  SlManagerOverview,
  SlManagerUser,
  SlManagerUserDetail,
  SlManagerAlerts,
  NotificationsResponse,
  CalendarEvent,
  CreateCalendarEventDto,
  UpdateCalendarEventDto,
} from '../types';

type RawCourseResult = Partial<CourseSearchResult> & {
  similarity?: number;
  metadata?: Record<string, unknown>;
};

type RawConversation = AiConversation & {
  _count?: { messages?: number };
};

function normalizeRelevance(minRelevance?: number) {
  if (typeof minRelevance !== 'number') return undefined;
  const normalized = minRelevance > 1 ? minRelevance / 5 : minRelevance;
  return Math.max(0, Math.min(1, Number(normalized.toFixed(2))));
}

function normalizeCourseResult(course: RawCourseResult): CourseSearchResult {
  const metadata =
    course.metadata && typeof course.metadata === 'object'
      ? (course.metadata as Record<string, unknown>)
      : {};

  const normalizeLevel = (l?: string) => {
    if (!l) return undefined;
    const lower = l.toLowerCase();
    if (lower.includes('begin') || lower.includes('inician')) return 'beginner';
    if (lower.includes('intermed')) return 'intermediate';
    if (lower.includes('advanc') || lower.includes('avanç')) return 'advanced';
    return undefined;
  };

  const normalizedLevel = normalizeLevel(course.level as string);

  const tags = Array.isArray(course.tags)
    ? course.tags.filter((tag): tag is string => typeof tag === 'string')
    : [];

  const fallbackUrl = typeof metadata.url === 'string' ? metadata.url : '#';
  const fallbackPlatformId = typeof metadata.platformId === 'string' ? metadata.platformId : 'external';
  const fallbackPlatformName =
    typeof metadata.platformName === 'string'
      ? metadata.platformName
      : typeof metadata.provider === 'string'
        ? metadata.provider
        : 'Plataforma externa';

  return {
    externalId: typeof course.externalId === 'string' ? course.externalId : '',
    title: typeof course.title === 'string' ? course.title : 'Curso relacionado',
    description: typeof course.description === 'string' ? course.description : undefined,
    url: typeof course.url === 'string' ? course.url : fallbackUrl,
    instructor: typeof course.instructor === 'string' ? course.instructor : undefined,
    language: typeof course.language === 'string' ? course.language : undefined,
    rating: typeof course.rating === 'number' ? course.rating : undefined,
    durationHours: typeof course.durationHours === 'number' ? course.durationHours : undefined,
    level: normalizedLevel,
    tags,
    platformId: typeof course.platformId === 'string' ? course.platformId : fallbackPlatformId,
    platformName: typeof course.platformName === 'string' ? course.platformName : fallbackPlatformName,
    isFree: typeof course.isFree === 'boolean' ? course.isFree : undefined,
    price: typeof course.price === 'string' ? course.price : undefined,
    relevance: typeof course.relevance === 'number' ? course.relevance : undefined,
    similarityScore:
      typeof course.similarityScore === 'number'
        ? course.similarityScore
        : typeof course.similarity === 'number'
          ? course.similarity
          : undefined,
    relevanceScore:
      typeof course.relevanceScore === 'number'
        ? course.relevanceScore
        : typeof course.similarity === 'number'
          ? course.similarity
          : undefined,
    internalRating: typeof course.internalRating === 'number' ? course.internalRating : undefined,
    internalRelevance: typeof course.internalRelevance === 'number' ? course.internalRelevance : undefined,
    completedCount: typeof course.completedCount === 'number' ? course.completedCount : undefined,
  };
}

function normalizeSearchResponse(payload: SearchResponse | Record<string, unknown>): SearchResponse {
  const raw = payload as Record<string, unknown>;
  const rawResults = Array.isArray(raw.results) ? (raw.results as RawCourseResult[]) : [];
  const results = rawResults.map(normalizeCourseResult).filter((item) => !!item.externalId);

  const platforms = Array.isArray(raw.platforms)
    ? raw.platforms.filter((item): item is string => typeof item === 'string')
    : [];

  const platformsAnalyzed = Array.isArray(raw.platformsAnalyzed)
    ? raw.platformsAnalyzed.filter((item): item is string => typeof item === 'string')
    : [];

  return {
    query: typeof raw.query === 'string' ? raw.query : '',
    total: typeof raw.total === 'number' ? raw.total : results.length,
    page: typeof raw.page === 'number' ? raw.page : undefined,
    totalPages: typeof raw.totalPages === 'number' ? raw.totalPages : undefined,
    results,
    platforms: platforms.length > 0 ? platforms : platformsAnalyzed,
    platformsAnalyzed,
    semanticRanking:
      typeof raw.semanticRanking === 'boolean'
        ? raw.semanticRanking
        : results.some(
            (item) =>
              typeof item.relevanceScore === 'number' || typeof item.similarityScore === 'number',
          ),
    timestamp: typeof raw.timestamp === 'string' ? raw.timestamp : undefined,
  };
}

function normalizeConversation(conversation: RawConversation): AiConversation {
  const { _count, ...rest } = conversation;
  return {
    ...rest,
    messageCount:
      typeof conversation.messageCount === 'number'
        ? conversation.messageCount
        : _count?.messages,
  };
}

// ─── Auth / Profile ───────────────────────────────────────────────────────────

export const profileApi = {
  getMe: () =>
    api.get<User>('/auth/me'),

  update: (dto: UpdateProfileDto) =>
    api.patch<User>('/auth/me', dto),
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

export interface CreateAdminPlatformPayload {
  name: string;
  type: string;
  apiEndpoint?: string;
  apiKeyRequired?: boolean;
  apiKey?: string;
  enabled?: boolean;
  searchEnabled?: boolean;
  config?: string; // JSON string
}

export interface UpdateAdminPlatformPayload {
  name?: string;
  type?: string;
  apiEndpoint?: string;
  apiKeyRequired?: boolean;
  isActive?: boolean;
  isSearchEnabled?: boolean;
  apiKey?: string;
  config?: string; // JSON string
}

export const platformsApi = {
  getAll: () =>
    api.get<LearningPlatform[]>('/admin/platforms'),

  create: (data: CreateAdminPlatformPayload) =>
    api.post<LearningPlatform>('/admin/platforms', data),

  update: (id: string, data: UpdateAdminPlatformPayload) =>
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
    limit: number = 20,
    platforms?: string[],
    isFree?: boolean,
    minInternalRating?: number,
    minRelevance?: number,
    level?: string,
    language?: string,
    page: number = 1,
    minRating?: number
  ) =>
    api
      .get<SearchResponse | Record<string, unknown>>('/search', {
        params: {
          q,
          limit,
          page,
          platforms,
          isFree,
          minInternalRating,
          minRelevance: normalizeRelevance(minRelevance),
          level,
          language,
          minRating,
        },
      })
      .then((res) => ({
        ...res,
        data: normalizeSearchResponse(res.data),
      })),

  getCourse: (externalId: string) =>
    api.get<CourseSearchResult>(`/search/course/${externalId}`),

  getRelated: (externalId: string) =>
    api.get<RawCourseResult[]>(`/search/course/${externalId}/related`).then((res) => ({
      ...res,
      data: (Array.isArray(res.data) ? res.data : [])
        .map(normalizeCourseResult)
        .filter((item) => !!item.externalId),
    })),

  getPlatforms: () =>
    api.get<LearningPlatform[]>('/search/platforms'),
};

// ─── AI / Recommendations ─────────────────────────────────────────────────────

export const recommendationsApi = {
  /**
   * Personalised recommendations for the logged-in user.
   * POST /ai/recommendations
   * Response: { courses[], hasContextualCourses, summary, metadata }
   */
  getForMe: () =>
    api.post<RecommendationResponse>('/ai/recommendations', {}),

  /**
   * Welcome/greeting message on first AI assistant load.
   * GET /ai/recommendations/welcome  (falls back to POST)
   * Response: { welcome: string }
   */
  getWelcome: () =>
    api.get<WelcomeResponse>('/ai/recommendations/welcome'),
};

// ─── AI / Chat ────────────────────────────────────────────────────────────────

export const chatApi = {
  /**
   * Synchronous chat — POST /ai/chat
   * Body: { prompt, conversationId?, mentionedTrainingIds? }
   * Response: { query, answer, conversationId, qualityScore, sources }
   */
  send: (prompt: string, conversationId?: string, mentionedTrainingIds?: string[]) =>
    api.post<AiChatResponse>('/ai/chat', { prompt, conversationId, mentionedTrainingIds }),

  /**
   * List all stored chat sessions for the current user — GET /ai/conversations
   */
  listConversations: () =>
    api.get<RawConversation[]>('/ai/conversations').then((res) => ({
      ...res,
      data: (Array.isArray(res.data) ? res.data : []).map(normalizeConversation),
    })),

  /**
   * Delete a stored chat session — DELETE /ai/conversations/:id
   */
  deleteConversation: (id: string) =>
    api.delete(`/ai/conversations/${id}`),

  /**
   * Load all messages of a conversation — GET /ai/conversations/:id/messages
   * Response: { conversationId, title, messages: { id, role, content, createdAt }[] }
   */
  getConversationMessages: (id: string) =>
    api.get<{ conversationId: string; title?: string; messages: { id: string; role: string; content: string; createdAt: string }[] }>(`/ai/conversations/${id}/messages`),

  /**
   * List courses the user can @mention in chat — GET /ai/chat/mentionable-courses
   */
  getMentionableCourses: () =>
    api.get<MentionableCourse[]>('/ai/chat/mentionable-courses'),

  /**
   * Generate a structured course plan — POST /ai/chat/course-plan
   * Body: { trainingId, focus? }
   */
  generateCoursePlan: (trainingId: string, focus?: string) =>
    api.post<CoursePlanResponse>('/ai/chat/course-plan', { trainingId, focus }),
};

// ─── Settings ─────────────────────────────────────────────────────────────────

export const settingsApi = {
  get: () =>
    api.get<UserSettings>('/settings'),

  update: (dto: UpdateUserSettingsDto) =>
    api.patch<UserSettings>('/settings', dto),
};

// ─── Notifications ─────────────────────────────────────────────────────────────

export const notificationsApi = {
  getAll: (params?: { unreadOnly?: boolean; limit?: number; offset?: number }) =>
    api.get<NotificationsResponse>('/notifications', { params }),

  markAsRead: (id: string) =>
    api.patch<{ id: string; isRead: boolean }>(`/notifications/${id}/read`),

  markAllAsRead: () =>
    api.patch<{ count: number }>('/notifications/read-all'),
};

// ─── Calendar ─────────────────────────────────────────────────────────────────

export const calendarApi = {
  getAll: () =>
    api.get<CalendarEvent[]>('/calendar'),

  getOne: (id: string) =>
    api.get<CalendarEvent>(`/calendar/${id}`),

  create: (dto: CreateCalendarEventDto) =>
    api.post<CalendarEvent>('/calendar', dto),

  update: (id: string, dto: UpdateCalendarEventDto) =>
    api.patch<CalendarEvent>(`/calendar/${id}`, dto),

  remove: (id: string) =>
    api.delete<{ message: string }>(`/calendar/${id}`),
};

// ─── SL Manager ───────────────────────────────────────────────────────────────

export const slManagerApi = {
  getOverview: () =>
    api.get<SlManagerOverview>('/sl-manager/overview'),

  getUsers: () =>
    api.get<SlManagerUser[]>('/sl-manager/users'),

  getUserDetail: (id: string) =>
    api.get<SlManagerUserDetail>(`/sl-manager/users/${id}`),

  getAlerts: () =>
    api.get<SlManagerAlerts>('/sl-manager/alerts'),
};

