// ─── Enums (mirror do backend) ───────────────────────────────────────────────

export type Role = 'ADMIN' | 'USER' | 'SERVICE_LINE_MANAGER';

export type ServiceLine =
  | 'HYBRID_CLOUD'
  | 'DATA'
  | 'BUSINESS_APPLICATIONS'
  | 'APPLICATION_OPERATIONS'
  | 'SOURCING_TALENT_MANAGEMENT';

export const SERVICE_LINE_LABELS: Record<ServiceLine, string> = {
  HYBRID_CLOUD: 'Hybrid Cloud',
  DATA: 'Data',
  BUSINESS_APPLICATIONS: 'Business Applications',
  APPLICATION_OPERATIONS: 'Application Operations',
  SOURCING_TALENT_MANAGEMENT: 'Sourcing & Talent Management',
};

export type ExperienceLevel = 'junior' | 'intermedio' | 'senior' | 'especialista' | 'lider';

export type TrainingStatus = 'ongoing' | 'completed' | 'priority' | 'later' | 'cancelled';

export type CourseLevel = 'beginner' | 'intermediate' | 'advanced';

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface UserSkill {
  skillName: string;
  level: 'iniciante' | 'intermedio' | 'experiente';
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  serviceLine: ServiceLine | null;
  userFunction?: string;
  onboardingDone: boolean;
  managedLineId: ServiceLine | null;
  experienceLevel?: ExperienceLevel;
  interests?: string[];
  skills?: UserSkill[];
  techStack?: string[];
  preferences?: UserPreferences;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateProfileDto {
  name?: string;
  experienceLevel?: ExperienceLevel;
  interests?: string[];
  skills?: UserSkill[];
  serviceLine?: ServiceLine;
  userFunction?: string;
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
  emailNotifications: boolean;
  weeklyDigest: boolean;
  recommendations: boolean;
  newCourses: boolean;
  learningProgress: boolean;
  certExpiring: boolean;
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
  price?: string;
  relevance?: number;
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
  price?: string;
  relevance?: number;
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
  notes?: string;
  rating?: number;
  relevance?: number;
  durationHours?: number;
  progressLevel?: string;
  priorityOrder?: number;
  certificate?: Certificate;
  documents?: TrainingDocument[];
  resources?: TrainingResource[];
  createdAt?: string;
}

export interface TrainingResource {
  id: string;
  trainingId: string;
  title: string;
  content: string;
  files: ResourceFile[];
  position: number;
  createdAt: string;
}

export interface ResourceFile {
  id: string;
  resourceId: string;
  fileUrl: string;
  fileName: string;
  createdAt: string;
}

export interface TrainingDocument {
  id: string;
  trainingId: string;
  fileUrl: string;
  fileName: string;
  createdAt: string;
}

export interface CreateTrainingRecordDto {
  title: string;
  url: string;
  status?: TrainingStatus;
  platformId?: string;
  startedAt?: string;
  notes?: string;
}

export interface UpdateTrainingRecordDto {
  status?: TrainingStatus;
  notes?: string;
  rating?: number;
  relevance?: number;
  completedAt?: string;
  progressLevel?: string;
  priorityOrder?: number;
}

export interface TrainingStats {
  total: number;
  ongoing: number;
  completed: number;
  priority: number;
  later: number;
  cancelled: number;
  avgRating: number;
  totalHours: number;
}

// ─── Certificates ─────────────────────────────────────────────────────────────

export type CertificateStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface CertificateJob {
  certificateId?: string;
  jobId: string;
  status: CertificateStatus;
  errorMessage?: string;
}

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
  status?: CertificateStatus;
  jobId?: string;
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
  source?: string;
}

/** Response from POST /ai/recommendations */
export interface RagResponse {
  // Recommendations endpoint — always 3 structured fields
  improvement?: string;
  interests?: string;
  missing_skills?: string;
  // Chat / welcome endpoints
  query?: string;
  answer?: string;
  welcome?: string;
  sources?: RagSource[];
  metadata?: {
    sourcesCount?: number;
    qualityScore?: number;
    timestamp?: string;
    [key: string]: unknown;
  };
}

/** Response from POST /ai/chat and POST /ai/chat/stream (final frame) */
export interface AiChatResponse {
  query: string;
  answer: string;
  conversationId: string;
  qualityScore: number;
  sources: RagSource[];
}

/** A stored chat session returned by GET /ai/conversations */
export interface AiConversation {
  id: string;
  title?: string;
  createdAt: string;
  updatedAt?: string;
  messageCount?: number;
}

export interface AiMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  fullContent?: string;
  timestamp: string;
  courses?: CourseSearchResult[];
  sources?: RagSource[];
  qualityScore?: number;
  conversationId?: string;
  isLoading?: boolean;
  isStreaming?: boolean;
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
