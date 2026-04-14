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

export type TrainingStatus = 'ongoing' | 'completed' | 'priority' | 'later' | 'accessed' | 'cancelled';

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
  // Notificações (campos persistidos no backend)
  notifyWeeklyRecs: boolean;
  notifyCertExpiry: boolean;
  notifyProgress: boolean;
  notifyByEmail: boolean;
  notifyInApp: boolean;
  // Idioma da interface (persistido no backend)
  uiLanguage?: string;
}

export type UpdateUserSettingsDto = Partial<Omit<UserSettings, 'id' | 'userId'>>;

// ─── Notifications ────────────────────────────────────────────────────────────

export type NotificationType =
  | 'TRAINING_COMPLETED'
  | 'CERTIFICATE_PROCESSED'
  | 'CERTIFICATE_EXPIRING'
  | 'WEEKLY_RECOMMENDATION'
  | 'PASSWORD_RESET'
  | 'EMAIL_VERIFICATION'
  | 'WELCOME'
  | 'GENERAL'
  | 'CALENDAR_REMINDER';

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface NotificationsResponse {
  items: AppNotification[];
  total: number;
  unreadCount: number;
}

// ─── Calendar ─────────────────────────────────────────────────────────────────

export interface CalendarEvent {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  eventDate: string; // ISO 8601 datetime
  reminderMinutesBefore: number;
  reminderFireAt: string;
  dayBeforeNotified: boolean;
  dayOfNotified: boolean;
  finalReminderNotified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCalendarEventDto {
  title: string;
  description?: string;
  eventDate: string; // ISO 8601 datetime
  reminderMinutesBefore?: number; // 15–1440, default 30
}

export type UpdateCalendarEventDto = Partial<CreateCalendarEventDto>;

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
  language?: string;
  /** Rating externo da plataforma de origem (ex: 4.5 no Udemy) */
  rating?: number;
  durationHours?: number;
  level?: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  platformId: string;
  platformName: string;
  /** True = gratuito, false = pago, undefined = desconhecido */
  isFree?: boolean;
  /** Campo legado — preferir isFree quando disponível */
  price?: string;
  relevance?: number;
  similarityScore?: number;
  relevanceScore?: number;
  /** Média do rating interno dado pelos utilizadores Softinsa após conclusão */
  internalRating?: number;
  /** Média da relevância interna dada pelos utilizadores Softinsa após conclusão */
  internalRelevance?: number;
  /** Número de vezes que foi concluído na Softinsa */
  completedCount?: number;
  /** Estado do curso para o utilizador autenticado (devolvido pelo backend quando autenticado) */
  userStatus?: TrainingStatus;
}

export interface CourseDetail extends CourseSearchResult {
  platform?: { id: string; name: string };
}

export interface SearchResponse {
  query: string;
  total: number;
  page?: number;
  totalPages?: number;
  results: CourseSearchResult[];
  platforms?: string[];
  platformsAnalyzed?: string[];
  semanticRanking?: boolean;
  timestamp?: string;
}

export interface SearchQuery {
  q: string;
  limit?: number;
  page?: number;
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
  durationHours?: number;
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
  jobId?: string;
  status?: CertificateStatus;
  state?: string;
  progress?: number | Record<string, unknown>;
  result?: Certificate;
  failedReason?: string;
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
  type?: string;
  baseUrl?: string;
  apiEndpoint?: string;
  logoUrl?: string;
  apiKey?: string;
  apiKeyRequired?: boolean;
  isActive: boolean;
  isSearchEnabled: boolean;
  config?: Record<string, unknown>;
  totalCourses?: number;
  createdAt?: string;
}

// ─── AI ───────────────────────────────────────────────────────────────────────

export interface RagSource {
  id: string;
  content: string;
  similarity: number;
  source?: string;
}

/** Course that can be @mentioned in chat — GET /ai/chat/mentionable-courses */
export interface MentionableCourse {
  id: string;
  title: string;
  url?: string;
  status: TrainingStatus;
  platform?: { name: string };
}

/** Phase in a course learning plan — POST /ai/chat/course-plan */
export interface CoursePlanPhase {
  phase: string;
  topics: string[];
  estimatedTime: string;
}

/** Response from POST /ai/chat/course-plan */
export interface CoursePlanResponse {
  trainingId: string;
  courseTitle: string;
  overview: string;
  prerequisites: string[];
  learningPath: CoursePlanPhase[];
  keyObjectives: string[];
  studyTips: string[];
  totalEstimatedTime: string;
  afterCompletion: string;
}

/** Welcome endpoint — GET /ai/recommendations/welcome */
export interface WelcomeResponse {
  welcome: string;
}

/** Single course item in POST /ai/recommendations response */
export interface RecommendedCourse {
  title: string;
  category: 'improvement' | 'interests' | 'missing_skills';
  reason: string;
  level?: string;
  estimatedHours?: number | null;
}

/** Metadata block returned with POST /ai/recommendations */
export interface RecommendationMetadata {
  sourcesCount?: number;
  catalogueSize?: number;
  maxSimilarity?: number;
  profileScore?: number;
  timestamp?: string;
  fromCache?: boolean;
  error?: string;
  info?: string;
}

/** Response from POST /ai/recommendations */
export interface RecommendationResponse {
  courses: RecommendedCourse[];
  hasContextualCourses: boolean;
  summary: string;
  metadata: RecommendationMetadata;
}

/**
 * @deprecated Use RecommendationResponse for dashboard.
 * Kept only for chat/welcome response compatibility.
 */
export interface RagResponse {
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
  managedLineId?: ServiceLine;
}

export interface AdminOverview {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  onboardingRate: number;
  newUsersThisMonth: number;
  usersByRole: Record<string, number>;
  usersByServiceLine: Record<string, number>;
  usersByExperienceLevel: Record<string, number>;
}

export interface AdminTrainingStats {
  total: number;
  byStatus: Record<string, number>;
  completionRate: number;
}

export interface AdminCertificateStats {
  total: number;
  byStatus: Record<string, number>;
  issuedThisMonth: number;
  expiringIn30Days: number;
  expiringIn31to60Days: number;
}

export interface AdminAiUsageStats {
  totalConversations: number;
  conversationsLast30Days: number;
  totalMessages: number;
  avgMessagesPerConversation: number;
}

export interface AdminPlatformStats {
  total: number;
  active: number;
  inactive: number;
  totalIndexedCourses: number;
}

export interface AdminRecentUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
  serviceLine: ServiceLine | null;
}

export interface AdminAnalytics {
  // Structured sections (new)
  overview?: AdminOverview;
  trainingStats?: AdminTrainingStats;
  certificateStats?: AdminCertificateStats;
  aiUsageStats?: AdminAiUsageStats;
  platformStats?: AdminPlatformStats;
  recentUsers?: AdminRecentUser[];
  // Chart data (existing)
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

// ─── SL Manager ───────────────────────────────────────────────────────────────

export interface SlManagerOverview {
  serviceLine: string;
  totalMembers: number;
  activeMembers: number;
  inactiveMembers: number;
  membersByExperienceLevel: Record<string, number>;
  trainingStats: {
    totalCompleted: number;
    completedLast30Days: number;
    ongoing: number;
    avgCompletedPerMember: number;
  };
  certificateStats: {
    totalActive: number;
    expiringIn90Days: number;
  };
  totalSkillsTracked: number;
}

export interface SlManagerUser {
  id: string;
  name: string;
  email: string;
  userFunction: string | null;
  experienceLevel: string | null;
  isActive: boolean;
  onboardingDone: boolean;
  joinedAt: string;
  skillsCount: number;
  trainings: {
    total: number;
    completed: number;
    ongoing: number;
    lastCompletedAt: string | null;
  };
  certificates: {
    active: number;
    expiringSoon: number;
  };
}

export interface SlManagerCompletedTraining {
  id: string;
  title: string;
  platform: string | null;
  completedAt: string | null;
  durationHours: number | null;
  rating: number | null;
}

export interface SlManagerOngoingTraining {
  id: string;
  title: string;
  platform: string | null;
  startedAt: string | null;
}

export interface SlManagerUserCertificate {
  id: string;
  courseName: string | null;
  provider: string | null;
  completionDate: string | null;
  expirationDate: string | null;
  status: string;
  fileUrl: string;
  isExpired: boolean;
  daysUntilExpiry: number | null;
}

export interface SlManagerUserSkill {
  skillName: string;
  level: string;
  createdAt: string;
}

export interface SlManagerUserDetail {
  profile: {
    id: string;
    name: string;
    email: string;
    userFunction: string | null;
    experienceLevel: string | null;
    isActive: boolean;
    onboardingDone: boolean;
    interests: string[];
    joinedAt: string;
  };
  summary: {
    totalTrainings: number;
    completedTrainings: number;
    ongoingTrainings: number;
    totalLearningHours: number;
    avgRating: number | null;
    totalCertificates: number;
    activeCertificates: number;
    expiredCertificates: number;
    certificatesExpiringSoon: number;
    skillsCount: number;
  };
  completedTrainings: SlManagerCompletedTraining[];
  ongoingTrainings: SlManagerOngoingTraining[];
  certificates: SlManagerUserCertificate[];
  skills: SlManagerUserSkill[];
}

export interface SlManagerCertExpiryAlert {
  userId: string;
  userName: string;
  courseName: string;
  expirationDate: string;
  daysLeft: number;
  urgency: 'critical' | 'warning' | 'info';
}

export interface SlManagerInactiveUser {
  userId: string;
  userName: string;
  userFunction: string | null;
  lastActivityAt: string | null;
  daysSinceActivity: number | null;
  hasNoCompletions: boolean;
}

export interface SlManagerAlerts {
  summary: {
    certExpiryCritical: number;
    certExpiryWarning: number;
    certExpiryInfo: number;
    inactiveUsersCount: number;
    usersWithNoTrainingsCount: number;
  };
  certExpiryAlerts: SlManagerCertExpiryAlert[];
  inactiveUsers: SlManagerInactiveUser[];
  usersWithNoTrainings: SlManagerInactiveUser[];
}

export interface SlManagerActivityItem {
  userId: string;
  userName: string;
  action: 'completed' | 'enrolled' | 'certificate';
  courseTitle: string;
  date: string;
}

// ─── Collections ──────────────────────────────────────────────────────────────

export interface CollectionCourse {
  id: string;
  collectionId: string;
  externalId: string;
  title: string;
  url: string;
  platformId?: string;
  platformName?: string;
  addedAt: string;
}

export interface Collection {
  id: string;
  userId: string;
  name: string;
  description?: string;
  courses: CollectionCourse[];
  courseCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCollectionDto {
  name: string;
  description?: string;
}

export interface AddCourseToCollectionDto {
  externalId: string;
  title: string;
  url: string;
  platformId?: string;
  platformName?: string;
}

// ─── Progress Report ──────────────────────────────────────────────────────────

export interface ProgressReport {
  user: {
    name: string;
    email: string;
    role: string;
    serviceLine: string | null;
    userFunction?: string;
    experienceLevel?: string;
    skills: UserSkill[];
    interests: string[];
    memberSince?: string;
  };
  stats: {
    totalCompleted: number;
    totalHours: number;
    avgRating: number;
    avgRelevance: number;
    totalCertificates: number;
    activeCertificates: number;
  };
  completedTrainings: Array<{
    id: string;
    title: string;
    platform?: string;
    completedAt?: string;
    durationHours?: number;
    rating?: number;
    hasCertificate: boolean;
  }>;
  ongoingTrainings: Array<{
    id: string;
    title: string;
    platform?: string;
    startedAt?: string;
  }>;
  certificates: Array<{
    id: string;
    courseName?: string;
    provider?: string;
    completionDate?: string;
    expirationDate?: string;
    isExpired?: boolean;
  }>;
  generatedAt: string;
}
