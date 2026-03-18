// ─── Enums (mirror do backend) ───────────────────────────────────────────────

export type Role = 'ADMIN' | 'USER';

export type ExperienceLevel = 'JUNIOR' | 'MID' | 'SENIOR';

export type TrainingStatus = 'ongoing' | 'completed' | 'priority' | 'later';

export type CourseLevel = 'beginner' | 'intermediate' | 'advanced';

export type ExperienceLevelBackend = 'junior' | 'mid' | 'senior' | 'lead';

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

// ─── User ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  experienceLevel?: ExperienceLevel;
  techStack?: string[];
  interests?: string[];
  preferences?: UserPreferences;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateProfileDto {
  name?: string;
  experienceLevel?: ExperienceLevel;
  techStack?: string[];
  interests?: string[];
}

export interface UserPreferences {
  id: string;
  userId: string;
  enabledPlatforms: string[];
  preferredLanguage?: string;
  notificationRenewals: boolean;
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export interface UserSettings {
  id?: string;
  userId?: string;
  // Preferências de aprendizagem
  preferredPlatforms: string[];
  contentTypes: string[];
  preferredDuration: string | null;
  courseLanguage: string | null;
  freeContentOnly: boolean;
  // Preferências da IA
  aiResponseDetail: string | null;
  aiResponseLanguage: string | null;
  aiExplainReasoning: boolean;
  aiRecommendationMode: string | null;
  // Notificações
  notifyWeeklyRecs: boolean;
  notifyCertExpiry: boolean;
  renewalPeriodMonths: number;
  notifyProgress: boolean;
  notifyByEmail: boolean;
  notifyInApp: boolean;
  // Privacidade
  adminCanSeeRecs: boolean;
  aiCanUseHistory: boolean;
  // Idioma da interface
  uiLanguage?: string;
}

export type UpdateUserSettingsDto = Partial<Omit<UserSettings, 'id' | 'userId'>>;

// ─── Course / Search ──────────────────────────────────────────────────────────

export interface Course {
  id: string;
  externalId: string;
  title: string;
  description?: string;
  url: string;
  instructor?: string;
  rating?: number;
  durationHours?: number;
  level?: CourseLevel;
  tags: string[];
  platformId: string;
  platform?: LearningPlatform;
  createdAt?: string;
  updatedAt?: string;
}

export interface CourseSearchResult {
  externalId: string;
  title: string;
  description?: string;
  url: string;
  instructor?: string;
  rating?: number;
  durationHours?: number;
  level?: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  platformId: string;
  platformName: string;
  similarityScore?: number;
  relevanceScore?: number;
}

export interface CourseDetail extends CourseSearchResult {
  platform?: { id: string; name: string };
}

export interface SearchResponse {
  query: string;
  total: number;
  results: CourseSearchResult[];
  platforms: string[];
  semanticRanking: boolean;
}

export interface SearchQuery {
  q: string;
  limit?: number;
  platforms?: string[];
}

// ─── Training Records ─────────────────────────────────────────────────────────

export interface TrainingRecord {
  id: string;
  userId: string;
  platformId?: string;
  platform?: { id: string; name: string };
  title: string;
  url: string;
  status: TrainingStatus;
  startedAt?: string;
  completedAt?: string;
  durationHours?: number;
  notes?: string;
  rating?: number;
  certificate?: Certificate;
  createdAt?: string;
}

export interface CreateTrainingRecordDto {
  title: string;
  url: string;
  status?: TrainingStatus;
  platformId?: string;
  startedAt?: string;
  durationHours?: number;
  notes?: string;
}

export interface UpdateTrainingRecordDto {
  status?: TrainingStatus;
  notes?: string;
  rating?: number;
  completedAt?: string;
}

export interface TrainingStats {
  total: number;
  ongoing: number;
  completed: number;
  priority: number;
  later: number;
  avgRating: number;
  totalHours: number;
}

// ─── Certificates ─────────────────────────────────────────────────────────────

export interface Certificate {
  id: string;
  userId: string;
  trainingId: string;
  training?: { id: string; title: string; url: string; status: TrainingStatus };
  fileUrl: string;
  courseName?: string;
  provider?: string;
  completionDate?: string;
  expirationDate?: string;
  durationHours?: number;
  extractedMetadata?: Record<string, unknown>;
  createdAt?: string;
}

export interface UpdateCertificateDto {
  courseName?: string;
  provider?: string;
  completionDate?: string;
  expirationDate?: string;
  durationHours?: number;
}

// ─── Platforms ────────────────────────────────────────────────────────────────

export interface LearningPlatform {
  id: string;
  name: string;
  baseUrl?: string;
  logoUrl?: string;
  apiKey?: string;
  isActive: boolean;
  isSearchEnabled: boolean;
  config?: Record<string, unknown>;
  createdAt?: string;
}

// ─── AI ───────────────────────────────────────────────────────────────────────

export interface RagSource {
  id: string;
  content: string;
  similarity: number;
}

export interface RagResponse {
  query: string;
  answer: string;
  sources: RagSource[];
}

export interface AiMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  courses?: CourseSearchResult[];
  sources?: RagSource[];
  isLoading?: boolean;
}

export interface AiRecommendation {
  course: Course | CourseSearchResult;
  reason: string;
  score: number;
}

// ─── Generic ──────────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiError {
  message: string | string[];
  statusCode: number;
  error?: string;
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export interface AdminUser extends User {
  isActive: boolean;
  createdAt: string;
}

export interface UpdateUserRoleDto {
  role: Role;
}

export interface AdminAnalytics {
  completedByMonth: { month: string; count: number }[];
  platformUsage: { name: string; count: number }[];
  userGrowth: { month: string; count: number }[];
  topSkills: { skill: string; count: number }[];
  expiringCertificates: {
    userId: string;
    userName: string;
    courseName: string;
    expirationDate: string;
    daysLeft: number;
  }[];
}

// ─── Softinsa Learning ────────────────────────────────────────────────────────

export interface SoftinsaLearningContent {
  id: string;
  title: string;
  description?: string;
  url: string;
  department: string;
  isMandatory: boolean;
  skills: string[];
  level?: CourseLevel;
  durationHours?: number;
  hasCertificate: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateSoftinsaLearningDto = Omit<SoftinsaLearningContent, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateSoftinsaLearningDto = Partial<CreateSoftinsaLearningDto>;
