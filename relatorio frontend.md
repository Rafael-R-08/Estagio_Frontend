# Análise Completa do Learning Hub — Suporte ao Relatório Final

---

## PASSO 1 — INVENTÁRIO TÉCNICO

### 1.1 Stack Tecnológico Completo

| Camada | Tecnologia | Versão | Função |
|--------|-----------|--------|--------|
| Runtime | React | 19.2 | Framework de UI |
| Linguagem | TypeScript | 5.9 | Tipagem estática |
| Build | Vite | 7.x | Bundler + dev server |
| Routing | React Router DOM | 7.x | SPA navigation |
| Server State | TanStack React Query | 5.x | Cache + fetching de dados |
| HTTP | Axios | 1.x | Cliente HTTP com interceptors |
| UI Primitives | Radix UI | vários | Componentes acessíveis (label, radio, tooltip, slot) |
| Estilos | Tailwind CSS | 3.4 | Utility-first CSS |
| Animações | Framer Motion | 12.x | Animações declarativas |
| Formulários | React Hook Form + Zod | 7.x + 4.x | Formulários + validação de esquema |
| Internacionalização | i18next / react-i18next | 25.x / 16.x | PT/EN |
| Gráficos | Recharts | 3.x | Dashboards analytics |
| Datas | date-fns | 4.x | Manipulação de datas, locales PT/EN |
| Drag & Drop | @hello-pangea/dnd | 18.x | Reordenação de coleções |
| PWA | vite-plugin-pwa + Workbox | 1.x | Service Worker, offline, push |
| Ícones | Lucide React | 0.575 | Ícones SVG |
| Toasts | Sonner | 2.x | Notificações in-app |
| ZIP | JSZip | 3.x | Export de certificados |
| Markdown | react-markdown | 10.x | Renderização de respostas AI |
| Flag icons | flag-icons | 7.x | Seletor de idioma |

**Dev tools:**

| Ferramenta | Versão | Função |
|-----------|--------|--------|
| ESLint | 9.x | Linting TS/TSX |
| eslint-plugin-react-hooks | 7.x | Regras de hooks |
| PostCSS + Autoprefixer | 8.x / 10.x | Transformação CSS |
| TypeScript ESLint | 8.x | Type-aware linting |
| @vite-pwa/assets-generator | 1.x | Geração de ícones PWA |

**Deploy:** Bitbucket Pipelines (`bitbucket-pipelines.yml` presente na raiz).

---

### 1.2 Arquitetura do Sistema

```
┌─────────────────────────────────────────────┐
│           Browser (SPA React 19)            │
│                                             │
│  React Router → ProtectedRoute → AppLayout  │
│         ↓              ↓                    │
│   AuthContext     TanStack Query Cache       │
│         ↓              ↓                    │
│        Axios (lib/axios.ts)                 │
│    JWT Bearer  +  Refresh Token Queue       │
└──────────────────┬──────────────────────────┘
                   │ HTTP/HTTPS
              /api/* proxy (dev: Vite → localhost:3000)
                   │
┌──────────────────▼──────────────────────────┐
│           Backend NestJS (REST API)          │
│  Auth · Trainings · Certificates · AI/RAG   │
│  Search · Admin · SL-Manager · Calendar     │
│  Collections · Notifications · Push         │
└─────────────────────────────────────────────┘
```

**Padrão de comunicação:**
- Todos os pedidos REST via instância Axios centralizada (`src/lib/axios.ts`)
- Interceptor de pedido injeta `Authorization: Bearer <token>` automaticamente
- Interceptor de resposta: em `401`, tenta refresh token (fila para pedidos simultâneos); se falhar, redireciona para `/login`
- Parâmetros de array serializado como `key=val1&key=val2` (NestJS-compatible)
- Tokens e user armazenados em `localStorage` com chaves prefixadas `lh_*`

**Padrão de organização de código:** Feature Slices — cada funcionalidade tem `pages/`, `components/`, `hooks/` próprios. A camada de API é centralizada em `src/services/api.ts` com namespaces exportados (`profileApi`, `trainingApi`, `searchApi`, `chatApi`, etc.).

---

### 1.3 Modelo de Dados (inferido dos tipos TypeScript)

#### Entidades principais:

**User**
- `id`, `name`, `email`, `role` (ADMIN | USER | SERVICE_LINE_MANAGER)
- `serviceLine` (HYBRID_CLOUD | DATA | BUSINESS_APPLICATIONS | APPLICATION_OPERATIONS | SOURCING_TALENT_MANAGEMENT)
- `userFunction`, `onboardingDone`, `managedLineId`
- `experienceLevel` (junior | intermedio | senior | especialista | lider)
- `interests[]`, `skills[]` (UserSkill com `skillName` + nível), `techStack[]`
- `preferences` (UserPreferences: `enabledPlatforms[]`, `notificationRenewals`, `preferredLanguage`)

**TrainingRecord** (registo de aprendizagem)
- `id`, `userId`, `title`, `url`, `status` (ongoing | completed | priority | later | accessed | cancelled)
- `startedAt`, `completedAt`, `notes`, `rating`, `relevance`, `durationHours`, `progressLevel`, `priorityOrder`
- Relações: `platform`, `certificate`, `documents[]`, `resources[]`

**Certificate**
- `id`, `userId`, `trainingId`, `fileUrl`
- `courseName`, `provider`, `completionDate`, `expirationDate`, `durationHours`
- `extractedMetadata` (JSON — dados extraídos por IA do PDF)
- `status` (PENDING | PROCESSING | COMPLETED | FAILED), `jobId`

**CourseSearchResult** (curso do catálogo)
- `externalId`, `title`, `description`, `url`, `instructor`
- `rating`, `durationHours`, `level`, `tags[]`, `platformId`, `platformName`
- `isFree`, `similarityScore`, `relevanceScore`
- `internalRating`, `internalRelevance`, `completedCount` (métricas internas Softinsa)
- `userStatus` (estado do utilizador autenticado para esse curso)

**Collection** (coleção de cursos)
- `id`, `name`, `description`, `courses[]` (CollectionCourse)

**CalendarEvent**
- `id`, `userId`, `title`, `description`, `eventDate`, `reminderMinutesBefore`
- Flags: `dayBeforeNotified`, `dayOfNotified`, `finalReminderNotified`

**AppNotification**
- `type` (TRAINING_COMPLETED | CERTIFICATE_PROCESSED | CERTIFICATE_EXPIRING | WEEKLY_RECOMMENDATION | CALENDAR_REMINDER | WELCOME | GENERAL | ...)
- `title`, `body`, `isRead`, `metadata`

**LearningPlatform**
- `id`, `name`, `type`, `apiEndpoint`, `isActive`, `isSearchEnabled`, `totalCourses`

---

### 1.4 Autenticação e Autorização

**Fluxo de autenticação:**
1. POST `/auth/login` → recebe `access_token` + `refresh_token` + `user`
2. Tokens guardados em `localStorage` (chaves `lh_access_token`, `lh_refresh_token`)
3. `AuthContext` valida o token guardado ao arrancar via GET `/auth/me`
4. Em 401: interceptor tenta POST `/auth/refresh`; se falhar → `storage.clearAll()` + redirect `/login`

**Autorização (RBAC — Role-Based Access Control):**
- `ProtectedRoute` verifica `isAuthenticated` + `user.role`
- Rota `/admin` → só `ADMIN`
- Rotas `/sl-manager/*` → só `SERVICE_LINE_MANAGER`
- Todas as outras → qualquer utilizador autenticado
- `onboardingDone === false` → `OnboardingModal` é apresentado antes de qualquer rota

---

### 1.5 Endpoints da API — Inventário Completo

| Namespace | Método | Endpoint | Função |
|-----------|--------|----------|--------|
| **Auth** | POST | `/auth/login` | Login com email/password |
| | GET | `/auth/me` | Validar token + obter perfil |
| | POST | `/auth/refresh` | Renovar access token |
| **Profile** | PATCH | `/auth/me` | Atualizar perfil (nome, skills, etc.) |
| **Admin** | GET | `/admin/users` | Listar utilizadores |
| | PATCH | `/admin/users/:id/role` | Alterar role |
| | PATCH | `/admin/users/:id/deactivate` | Desativar conta |
| | PATCH | `/admin/users/:id/activate` | Ativar conta |
| | GET | `/admin/analytics` | Analytics completo |
| | GET | `/admin/audit` | Logs de auditoria |
| | GET/POST | `/admin/platforms` | Listar/criar plataformas |
| | PATCH/DELETE | `/admin/platforms/:id` | Editar/remover plataforma |
| **Certificates** | GET | `/certificates/me` | Listar certificados do utilizador |
| | POST | `/certificates` | Upload (multipart/form-data) |
| | GET | `/certificates/job/:id` | Estado do job de extração IA |
| | GET | `/certificates/renewal-alerts` | Alertas de renovação |
| | PATCH | `/certificates/:id` | Editar metadados |
| | POST | `/certificates/:id/reextract` | Re-extrair por IA |
| | DELETE | `/certificates/:id` | Eliminar |
| **Trainings** | GET | `/trainings` | Listar registos |
| | GET | `/trainings/stats` | Estatísticas (total, horas, etc.) |
| | POST | `/trainings` | Criar registo |
| | PATCH/DELETE | `/trainings/:id` | Editar/eliminar |
| | POST/DELETE | `/trainings/:id/documents` | Documentos anexos |
| | POST/PATCH/DELETE | `/trainings/:id/resources` | Recursos de estudo |
| **Search** | GET | `/search` | Pesquisa semântica de cursos |
| | GET | `/search/course/:id` | Detalhe de curso |
| | GET | `/search/course/:id/related` | Cursos relacionados |
| | GET | `/search/platforms` | Plataformas disponíveis |
| **AI** | POST | `/ai/recommendations` | Recomendações personalizadas |
| | GET | `/ai/recommendations/welcome` | Mensagem de boas-vindas |
| | DELETE | `/recommendations/me/cache` | Invalidar cache de recomendações |
| | POST | `/ai/chat` | Chat com assistente IA |
| | GET | `/ai/conversations` | Histórico de conversas |
| | DELETE | `/ai/conversations/:id` | Apagar conversa |
| | GET | `/ai/conversations/:id/messages` | Mensagens de conversa |
| | GET | `/ai/chat/mentionable-courses` | Cursos para @mention |
| | POST | `/ai/chat/course-plan` | Gerar plano de estudo |
| **Settings** | GET/PATCH | `/settings` | Preferências do utilizador |
| **Notifications** | GET | `/notifications` | Listar notificações |
| | PATCH | `/notifications/:id/read` | Marcar lida |
| | PATCH | `/notifications/read-all` | Marcar todas lidas |
| | DELETE | `/notifications/:id` | Eliminar |
| **Calendar** | GET/POST | `/calendar` | Eventos do calendário |
| | GET/PATCH/DELETE | `/calendar/:id` | CRUD evento |
| | GET | `/calendar/export.ics` | Export iCalendar |
| **Collections** | GET/POST | `/collections` | Coleções de cursos |
| | PATCH/DELETE | `/collections/:id` | Editar/eliminar |
| | POST/DELETE | `/collections/:id/courses` | Adicionar/remover curso |
| **Push** | GET | `/push/vapid-public-key` | Chave VAPID para WebPush |
| | POST/DELETE | `/push/subscribe` | Subscrever/cancelar push |
| **SL Manager** | GET | `/sl-manager/overview` | Visão geral da service line |
| | GET | `/sl-manager/users` | Membros da equipa |
| | GET | `/sl-manager/users/:id` | Detalhe de membro |
| | GET | `/sl-manager/alerts` | Alertas (certs expirados, etc.) |
| | GET | `/sl-manager/activity` | Feed de atividade |
| **Reports** | GET | `/reports/progress` | Relatório de progresso |

---

### 1.6 Componentes de UI Principais

| Componente | Localização | Função |
|-----------|-------------|--------|
| `AppLayout` | `layout/` | Shell principal: Header + FloatingDock + BottomNav + Outlet |
| `Header` | `layout/` | Barra topo: search, notificações, perfil |
| `FloatingDock` | `layout/` | Dock lateral desktop com navegação |
| `BottomNav` | `layout/` | Navegação inferior mobile |
| `ProtectedRoute` | `app/` | Guarda de rotas + onboarding gate |
| `AuthContext` | `auth/context/` | Estado global de autenticação |
| `LoginCard` | `auth/components/` | Formulário de login (React Hook Form) |
| `OnboardingModal` | `auth/components/` | Wizard de onboarding 3 slides |
| `ProductTour` | `onboarding/components/` | Tour interativo para novos utilizadores |
| `UnifiedRecommendationCard` | `dashboard/components/` | Cards de recomendações IA agrupadas por categoria |
| `MiniCalendar` | `dashboard/components/` | Calendário interativo com eventos persistidos |
| `AlertBanner` | `dashboard/components/` | Alertas de certificados a expirar |
| `QuickActions` | `dashboard/components/` | Ações rápidas no dashboard |
| `RecentActivity` | `dashboard/components/` | Feed de atividade recente |
| `SearchBar` | `search/components/` | Barra de pesquisa com typeahead |
| `FilterSidebar` | `search/components/` | Filtros staged (plataforma, nível, preço, rating) |
| `SearchResultCard` | `search/components/` | Card de resultado com status do utilizador |
| `CourseCompareModal` | `search/components/` | Comparação side-by-side de 2 cursos |
| `TrainingCard` | `my-learning/components/` | Card de formação com status badge |
| `CertificateCard` | `certificates/components/` | Card de certificado com estado de validade |
| `UploadModal` | `certificates/components/` | Upload com polling de job IA + preview |
| `CertificateDetailModal` | `certificates/components/` | Detalhe/edição de certificado |
| `ChatBubble` | `ai-assistant/components/` | Bolha de mensagem (user/assistant) |
| `ChatInput` | `ai-assistant/components/` | Input com @mention dropdown |
| `SuggestionsPanel` | `ai-assistant/components/` | Painel de sugestões e histórico |
| `SkillsRadarChart` | `profile/components/` | Radar chart de competências (Recharts) |
| `LearningImpactCard` | `profile/components/` | KPIs de aprendizagem no perfil |
| `AnalyticsTab` | `admin/components/` | Dashboards Recharts (bar, pie, line) |
| `AuditTab` | `admin/components/` | Tabela de logs de auditoria |
| `UsersTab` | `admin/components/` | Gestão de utilizadores |
| `PlatformsTab` | `admin/components/` | Gestão de plataformas |
| `InstallPrompt` | `components/ui/` | Banner de instalação PWA |

---

### 1.7 Integrações e Serviços Externos

| Serviço/Tecnologia | Integração | Onde |
|-------------------|-----------|------|
| **Web Push API** (VAPID) | Push notifications nativas | `pushApi`, `sw.ts` |
| **Workbox** (Google) | Service Worker strategies | `sw.ts`, `vite-plugin-pwa` |
| **iCalendar export** (RFC 5545) | Export de eventos do calendário | `calendarApi.exportIcs()` |
| **Backend IA/RAG** | Recomendações semânticas + Chat | `/ai/*` endpoints |
| **Plataformas LMS externas** | Pesquisa de cursos agregada | `/search` + `/admin/platforms` |
| **Bitbucket Pipelines** | CI/CD | `bitbucket-pipelines.yml` |

**Plataformas LMS integradas (via backend):** Udemy, Microsoft Learn, e outras configuráveis dinamicamente via `/admin/platforms` (fields `type`, `apiEndpoint`).

---

## PASSO 2 — MAPEAMENTO DE FUNCIONALIDADES

### F1 — Autenticação e Gestão de Sessão
**Problema:** Acesso seguro com persistência de sessão e renovação automática.  
**Implementação:** JWT + Refresh Token. Interceptor Axios com fila de pedidos durante refresh. `localStorage` para persistência. `AuthContext` com React Context API.  
**Ficheiros:** `src/lib/axios.ts`, `src/lib/storage.ts`, `src/features/auth/context/AuthContext.tsx`, `src/features/auth/hooks/useAuth.ts`  
**Decisão de design:** A fila `failedQueue` evita múltiplas chamadas simultâneas ao endpoint de refresh (race condition), garantindo que todos os pedidos pendentes são retomados após o refresh bem-sucedido.

---

### F2 — Onboarding de Novo Utilizador
**Problema:** Utilizadores novos precisam de ser introduzidos à plataforma antes de acederem ao dashboard.  
**Implementação:** `ProtectedRoute` verifica `user.onboardingDone`; se `false`, monta `OnboardingModal` (3 slides animados: Pesquisa, IA, Certificados). Ao completar, sinaliza `storage.setOnboardingSeen()` e o backend marca `onboardingDone=true`. `ProductTour` é um overlay interativo para utilizadores que já completaram o onboarding.  
**Ficheiros:** `src/app/ProtectedRoute.tsx`, `src/features/auth/components/OnboardingModal.tsx`, `src/features/onboarding/components/ProductTour.tsx`  
**Decisão de design:** O onboarding é interceptado a nível de rota, não de página, garantindo que não é possível contorná-lo.

---

### F3 — Dashboard Personalizado
**Problema:** Ponto de entrada centralizado com informação relevante para o utilizador.  
**Implementação:** 5 queries TanStack Query paralelas: recomendações IA, todos os trainings, alertas de certificados, stats de trainings. Saudação dinâmica por hora do dia. Componentes: `UnifiedRecommendationCard` (recomendações por categoria), `MiniCalendar`, `AlertBanner`, `QuickActions`, `RecentActivity`.  
**Ficheiros:** `src/features/dashboard/pages/DashboardPage.tsx` + todos os componentes `dashboard/components/`  
**Decisão de design:** `staleTime` configurado por query (5min para recomendações, 2min para trainings) para balancear frescura de dados e performance.

---

### F4 — Pesquisa Semântica de Cursos
**Problema:** Descoberta de cursos num catálogo multi-plataforma com ranking por relevância.  
**Implementação:** GET `/search` com parâmetros: `q`, `limit`, `page`, `platforms[]`, `isFree`, `minInternalRating`, `minRelevance` (normalizado 0-1), `level`, `language`, `minRating`. Filtros com estado staged (aplicados só ao clicar "Aplicar"). Modo browse (query vazia). Comparação de 2 cursos (`CourseCompareModal`). Toggle lista/grid.  
**Ficheiros:** `src/features/search/pages/SearchPage.tsx`, `src/features/search/components/FilterSidebar.tsx`, `src/features/search/components/CourseCompareModal.tsx`  
**Decisão de design:** Normalização de `similarityScore`/`relevanceScore` no frontend (`normalizeCourseResult`) para tratar inconsistências do backend. Filtros staged para não disparar chamadas a cada interação.

---

### F5 — Gestão de Formações (My Learning)
**Problema:** Tracking de progresso formativo do utilizador.  
**Implementação:** CRUD de `TrainingRecord`. Tabs por status: ongoing, completed, later, cancelled. Sorting/filtering local. Upload de documentos e recursos por formação. Drag & drop implícito via priorityOrder.  
**Ficheiros:** `src/features/my-learning/pages/MyLearningPage.tsx`, `src/features/my-learning/components/TrainingCard.tsx`

---

### F6 — Certificados com Extração por IA
**Problema:** Gestão do ciclo de vida de certificados com extração automática de metadados.  
**Implementação:** Upload multipart para POST `/certificates`. Polling assíncrono de `GET /certificates/job/:id` enquanto `status !== COMPLETED|FAILED`. Extração de `courseName`, `provider`, `completionDate`, `expirationDate`, `durationHours` via IA do backend. Alertas de expiração (< 30 dias). Export em ZIP com JSZip.  
**Ficheiros:** `src/features/certificates/components/UploadModal.tsx`, `src/features/certificates/pages/CertificatesPage.tsx`, `src/lib/zip.ts`  
**Decisão de design:** O polling é feito no frontend para não bloquear o upload — a extração por IA pode demorar vários segundos (BullMQ queue no backend).

---

### F7 — Assistente IA com Histórico de Conversas
**Problema:** Suporte inteligente a aprendizagem com contexto personalizado.  
**Implementação:** Chat síncrono via POST `/ai/chat` com `conversationId` para continuidade. Histórico persistido no backend (GET `/ai/conversations`). @mention de cursos do utilizador (`MentionableCourse[]`). Geração de planos de estudo estruturados (`CoursePlanResponse`). Mensagem de boas-vindas via GET `/ai/recommendations/welcome`.  
**Ficheiros:** `src/features/ai-assistant/pages/AiAssistantPage.tsx`, `src/features/ai-assistant/components/ChatInput.tsx`, `src/features/ai-assistant/components/ChatBubble.tsx`  
**Decisão de design:** `@mention` permite ao utilizador referenciar cursos concretos do seu registo de aprendizagem, passando `mentionedTrainingIds` ao backend para contexto RAG mais preciso.

> [NOTA PARA O RELATÓRIO] O backend suporta SSE streaming (`/ai/chat/stream`) mas o frontend usa atualmente a versão síncrona (`/ai/chat`). Implementação de streaming em tempo real é trabalho futuro.

---

### F8 — Recomendações Personalizadas por IA
**Problema:** Sugestão de cursos relevantes baseada no perfil do utilizador.  
**Implementação:** POST `/ai/recommendations` — backend usa RAG com perfil (skills, interests, service line, experience level) para gerar lista de cursos por categoria (`improvement`, `interests`, `missing_skills`). Cache invalidável manualmente. Renderização em `UnifiedRecommendationCard` com tabs por categoria.  
**Ficheiros:** `src/features/dashboard/components/UnifiedRecommendationCard.tsx`, `src/services/api.ts` (recommendationsApi)

---

### F9 — Perfil e Portfolio
**Problema:** Gestão de identidade profissional e exportação de portfólio de aprendizagem.  
**Implementação:** Edição de nome, nível de experiência, função, interesses (TagInput), skills (com níveis). `SkillsRadarChart` (Recharts). `PortfolioPage` é uma página imprimível (CSS `@media print`) gerada a partir dos dados reais: perfil + certificados + estatísticas.  
**Ficheiros:** `src/features/profile/pages/ProfilePage.tsx`, `src/features/profile/pages/PortfolioPage.tsx`, `src/features/profile/components/SkillsRadarChart.tsx`  
**Decisão de design:** O portfolio usa `window.print()` com `?print=1` na URL para compatibilidade máxima (sem dependências de PDF).

---

### F10 — Coleções de Cursos
**Problema:** Organização pessoal de cursos em listas temáticas partilháveis.  
**Implementação:** CRUD de `Collection`. Drag & drop para reordenar cursos dentro de coleções (`@hello-pangea/dnd`). Export como Markdown formatado copiado para clipboard. Adição de cursos do catálogo via `AddToCollectionModal`.  
**Ficheiros:** `src/features/collections/pages/CollectionsPage.tsx`, `src/lib/collection-export.ts`

---

### F11 — Calendário de Eventos
**Problema:** Planeamento de formações com lembretes automáticos.  
**Implementação:** Calendário mensal interativo com CRUD de eventos via API persistida. Seleção de data, configuração de lembrete (15-1440 minutos antes). Backend dispara notificações `CALENDAR_REMINDER` antes do evento. Export `.ics` (iCalendar) para integração com calendários externos.  
**Ficheiros:** `src/features/dashboard/components/MiniCalendar.tsx`, `src/services/api.ts` (calendarApi)

---

### F12 — Notificações In-App e Push
**Problema:** Comunicação proativa com o utilizador (cert a expirar, recomendações semanais, etc.).  
**Implementação:** Polling de notificações a cada 60s no `Header`. Badge com `unreadCount`. Dropdown de notificações. Web Push via VAPID (subscrição em `/push/subscribe`). Service Worker (`sw.ts`) trata evento `push` com `showNotification`. Schedulers no backend disparam notificações automaticamente.  
**Ficheiros:** `src/layout/Header.tsx`, `src/sw.ts`, `src/services/api.ts` (notificationsApi, pushApi), `src/features/settings/pages/SettingsPage.tsx`

---

### F13 — Painel de Administração
**Problema:** Gestão da plataforma por administradores.  
**Implementação:** 4 tabs via `?tab=` query param: **Users** (CRUD de roles, ativar/desativar), **Platforms** (CRUD de plataformas LMS), **Analytics** (dashboards Recharts: bar chart de trainings por mês, pie de distribuição, line chart de crescimento), **Audit** (log de ações).  
**Ficheiros:** `src/features/admin/pages/AdminPage.tsx`, `src/features/admin/components/`

---

### F14 — Service Line Manager
**Problema:** Gestão de equipas por responsáveis de área (service line).  
**Implementação:** Dashboard com KPIs (total membros, taxa de conclusão, certificados ativos), lista paginada de membros com detalhes de progresso, alertas de urgência (certs expirados, utilizadores inativos), feed de atividade da equipa.  
**Ficheiros:** `src/features/sl-manager/pages/SlManagerPage.tsx`, `src/features/sl-manager/pages/SlManagerUserDetailPage.tsx`

---

### F15 — PWA (Progressive Web App)
**Problema:** Acesso offline e experiência app-like em dispositivos móveis.  
**Implementação:** `vite-plugin-pwa` com estratégia `injectManifest` (custom service worker). Workbox: `precacheAndRoute` para assets estáticos, `NavigationRoute` para SPA fallback, `NetworkFirst` com cache de 24h para `/api/*`. `BeforeInstallPromptEvent` capturado globalmente para prompt de instalação persistente. `InstallPrompt` component + settings page com toggle.  
**Ficheiros:** `src/sw.ts`, `vite.config.ts`, `src/hooks/usePWAInstall.ts`, `src/components/ui/InstallPrompt.tsx`

---

### F16 — Internacionalização (i18n)
**Problema:** Suporte a múltiplos idiomas (PT/EN).  
**Implementação:** `i18next` com recursos carregados em bundled JSON (`locales/pt.json`, `locales/en.json`). Idioma persistido em `localStorage` (chave `lh_lang`). Seletor de idioma na landing page, no header e nas settings. `date-fns` usa `pt` ou `enUS` locale consoante idioma ativo.  
**Ficheiros:** `src/i18n/index.ts`, `src/i18n/locales/pt.json`, `src/i18n/locales/en.json`

---

### F17 — Relatório de Progresso Imprimível
**Problema:** Exportação do percurso formativo para uso externo (recursos humanos, etc.).  
**Implementação:** Página dedicada `/reports/progress` com dados de GET `/reports/progress`. Trigger de impressão automático com `?print=1`. Layout otimizado para impressão com `@media print` CSS.  
**Ficheiros:** `src/features/reports/pages/ProgressReportPage.tsx`

---

## PASSO 3 — PLANO DE ESCRITA DO RELATÓRIO

---

### CAPÍTULO 1 — Introdução *(recomendado: 8-12 páginas)*

#### 1.1 Entidade de Acolhimento — Softinsa (Grupo IBM)
- Descreve a Softinsa: missão, dimensão, service lines (Hybrid Cloud, Data, Business Applications, Application Operations, Sourcing & Talent Management)
- Explica o contexto do estágio no departamento de desenvolvimento
- **Figura sugerida:** organograma das service lines (criado manualmente, baseado nos dados do tipo `ServiceLine`)
- **Fonte a citar:** site oficial Softinsa / IBM Portugal

#### 1.2 Enquadramento e Motivação
- Problema real: colaboradores da Softinsa sem ferramenta centralizada para gerir formação contínua, descobrir cursos em múltiplas plataformas (Udemy, Microsoft Learn, etc.), controlar certificados
- Gap identificado: plataformas LMS existentes não integram múltiplas fontes nem recomendam por perfil técnico individual

#### 1.3 Objetivos
- Objetivo geral: desenvolver uma plataforma web inteligente de gestão de aprendizagem para a Softinsa
- Objetivos específicos (baseados nas funcionalidades implementadas):
  - Pesquisa unificada de cursos em múltiplas plataformas com ranking semântico
  - Recomendações personalizadas por IA com base no perfil do utilizador
  - Gestão do ciclo de vida de certificados com extração automática de metadados
  - Dashboard de progresso formativo individual e por service line
  - Assistente IA com histórico de conversas e contexto personalizado
  - Distribuição como PWA instalável com suporte offline

#### 1.4 Plano de Trabalho
- **Tabela sugerida:** gantt ou tabela de fases (Análise de requisitos → Design → Prototipagem → Implementação → Testes → Relatório)

#### 1.5 Estrutura do Relatório
- Parágrafo padrão a descrever os capítulos

---

### CAPÍTULO 2 — Estado da Arte *(recomendado: 15-20 páginas)*

#### 2.1 Aprendizagem Contínua no Contexto Empresarial
- Conceitos: corporate e-learning, upskilling, reskilling
- **Fontes:** Degreed (2023), LinkedIn Learning Workplace Learning Report
- **Citar:** Cross, J. (2006). *Informal Learning: Rediscovering the Natural Pathways That Inspire Innovation and Performance.*

#### 2.2 Plataformas LMS Existentes — Análise Comparativa

| Critério | Moodle | Canvas | Cornerstone | Degreed | Learning Hub |
|---------|--------|--------|-------------|---------|--------------|
| Open source | ✓ | ✗ | ✗ | ✗ | ✓ |
| Multi-plataforma | ✗ | ✗ | Parcial | ✓ | ✓ |
| Recomendações IA | ✗ | ✗ | Básico | ✓ | ✓ |
| Extração de certs. | ✗ | ✗ | ✗ | ✗ | ✓ (IA) |
| PWA | ✗ | Parcial | ✗ | ✗ | ✓ |
| Gestão por equipa | ✗ | Parcial | ✓ | ✓ | ✓ |

- **Fontes:** Docebo, Capterra LMS comparison 2024

#### 2.3 Retrieval-Augmented Generation (RAG)
- Explica RAG: embedding de documentos + recuperação semântica + geração LLM
- O Learning Hub usa RAG para recomendações e chat contextual
- **Fontes:**
  - Lewis, P. et al. (2020). Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks. *Advances in Neural Information Processing Systems.*
  - Gao, Y. et al. (2023). Retrieval-Augmented Generation for Large Language Models: A Survey. *arXiv.*

#### 2.4 Progressive Web Apps
- O que é PWA, critérios (installable, offline-capable, push notifications)
- Service Workers e Workbox
- **Fontes:**
  - Biørn-Hansen, A. et al. (2017). Progressive Web Apps: The Possible Web-native Unifier for Mobile Development. *International Conference on Web Information Systems and Technologies.*
  - Google Developers. (2023). *Progressive Web Apps documentation.*

#### 2.5 Arquiteturas Frontend Modernas
- SPA vs MPA vs Island Architecture
- React 19 (concurrent features), TanStack Query (server state)
- **Fontes:**
  - Dodds, K. C. (2022). *React Patterns.* (blog/documentação técnica)
  - Gaunt, M. (2015). Service Workers: An Introduction. *Google Developers.*

#### 2.6 Extração de Informação de Documentos por IA
- OCR + NLP para extração de metadados de PDFs
- **Citar:** Tesseract OCR, Amazon Textract (como benchmarks) vs implementação custom no backend

---

### CAPÍTULO 3 — Metodologias, Tecnologias e Ferramentas *(recomendado: 12-18 páginas)*

#### 3.1 Metodologia de Desenvolvimento
- Desenvolvimento iterativo/ágil (sprints informais)
- Feature-driven development (uma feature por vez, refletido na estrutura de pastas)
- Code review via Bitbucket (pipeline presente)

#### 3.2 Stack Frontend — Justificação das Escolhas
- **React 19:** concurrent rendering, `use()` hook, `Suspense` — justifica para SPA complexa
- **TypeScript:** type safety — mostra exemplos dos `interfaces` em `types/index.ts`
- **Vite 7:** HMR ultra-rápido, tree-shaking, módulos ES nativos
- **TanStack React Query:** elimina boilerplate de loading/error/cache manual; `staleTime` por query
- **Tailwind CSS + shadcn/ui:** design system consistente sem overhead de CSS-in-JS
- **Tabela sugerida:** Alternativas consideradas vs escolha final (ex: Redux vs TanStack Query; Chakra UI vs Tailwind)

#### 3.3 Arquitetura da Aplicação
- Diagrama da arquitetura de componentes (App → AuthProvider → Router → ProtectedRoute → AppLayout → Feature Pages)
- Feature Slice pattern explicado com diagrama de pastas
- **Figura sugerida:** diagrama de fluxo de autenticação JWT + refresh token queue

#### 3.4 Padrões de Comunicação com o Backend
- Axios instance centralizada + interceptors
- TanStack Query: `queryKey` conventions, cache invalidation (`queryClient.invalidateQueries`)
- `toList()` helper para normalizar respostas paginadas vs arrays

#### 3.5 PWA — Arquitetura do Service Worker
- Estratégia `injectManifest`: custom SW com Workbox strategies
- `precacheAndRoute`: assets estáticos
- `NetworkFirst` para `/api/*` com timeout de 10s e cache de 24h
- Push Notifications: VAPID, `showNotification`, `notificationclick` event
- **Figura sugerida:** diagrama de fluxo de uma request com service worker

#### 3.6 Internacionalização
- Estrutura de ficheiros `pt.json`/`en.json`
- Integração de `date-fns` locales

#### 3.7 Ferramentas de Desenvolvimento
- ESLint 9 com `react-hooks` + `react-refresh` plugins
- Bitbucket Pipelines (CI/CD)
- Vite proxy para desenvolvimento local

---

### CAPÍTULO 4 — Atividades Desenvolvidas *(recomendado: 20-25 páginas)*

#### 4.1 Análise de Requisitos
- Levantamento de requisitos junto da Softinsa
- User stories por role (USER, ADMIN, SERVICE_LINE_MANAGER)
- **Tabela sugerida:** tabela de requisitos funcionais vs não funcionais

#### 4.2 Design de Interface e Experiência
- Princípios aplicados: hierarquia visual, glassmorphism (backdrop-blur, border/60), dark mode nativo
- Responsive design: BottomNav (mobile) + FloatingDock (desktop)
- **Figuras sugeridas:**
  - Mockup da landing page (com typewriter effect, framer-motion)
  - Layout do dashboard
  - Modal de upload de certificado (estados: idle → preview → uploading → processing → completed)

#### 4.3 Implementação — Autenticação e Gestão de Sessão
- Código anotado do interceptor de refresh token (`src/lib/axios.ts` linhas 68-110)
- Fluxo AuthContext → ProtectedRoute → OnboardingModal

#### 4.4 Implementação — Motor de Pesquisa
- Normalização de resultados (`normalizeCourseResult`)
- Filtros staged
- Comparação de cursos
- **Figura sugerida:** screenshot da SearchPage com filtros activos

#### 4.5 Implementação — Certificados e Extração por IA
- Fluxo: upload → job queue → polling → resultado
- Preview de PDF/imagem no modal
- Export ZIP com `JSZip`
- **Figura sugerida:** diagrama de sequência do upload + polling

#### 4.6 Implementação — Assistente IA
- Arquitetura do chat: estados de mensagens, `conversationId`, `mentionedIds`
- @mention dropdown em `ChatInput`
- Geração de plano de estudo (`CoursePlanResponse`)
- **Figura sugerida:** screenshot do chat com uma resposta e sources

#### 4.7 Implementação — PWA
- Manifesto (`name`, `short_name`, `display: standalone`, categorias)
- Service Worker strategies
- `usePWAInstall` hook com `deferredPrompt` global
- **Figura sugerida:** screenshot do InstallPrompt em mobile

#### 4.8 Implementação — Painéis de Gestão (Admin + SL Manager)
- Admin: 4 tabs, gráficos Recharts
- SL Manager: KPIs, alertas com urgência critical/warning/info, paginação

#### 4.9 Testes e Validação
> [NOTA PARA O RELATÓRIO] Não foram encontrados ficheiros de testes automatizados no frontend (`.test.tsx`, `.spec.ts`, Jest, Vitest, Playwright). Menciona como limitação e trabalho futuro: implementar testes unitários com Vitest e testes E2E com Playwright.

- Descreve os testes manuais realizados
- Validação com utilizadores reais da Softinsa (se aplicável)

---

### CAPÍTULO 5 — Resultados Obtidos *(recomendado: 8-12 páginas)*

#### 5.1 Funcionalidades Implementadas

| # | Funcionalidade | Estado |
|---|---------------|--------|
| F1 | Autenticação e Gestão de Sessão | Implementado |
| F2 | Onboarding de Novo Utilizador | Implementado |
| F3 | Dashboard Personalizado | Implementado |
| F4 | Pesquisa Semântica de Cursos | Implementado |
| F5 | Gestão de Formações (My Learning) | Implementado |
| F6 | Certificados com Extração por IA | Implementado |
| F7 | Assistente IA com Histórico | Implementado |
| F8 | Recomendações Personalizadas por IA | Implementado |
| F9 | Perfil e Portfolio | Implementado |
| F10 | Coleções de Cursos | Implementado |
| F11 | Calendário de Eventos | Implementado |
| F12 | Notificações In-App e Push | Implementado |
| F13 | Painel de Administração | Implementado |
| F14 | Service Line Manager | Implementado |
| F15 | PWA (Progressive Web App) | Implementado |
| F16 | Internacionalização (PT/EN) | Implementado |
| F17 | Relatório de Progresso Imprimível | Implementado |
| — | Streaming SSE do chat IA | Não implementado (trabalho futuro) |
| — | Testes automatizados (Vitest/Playwright) | Não implementado (trabalho futuro) |

#### 5.2 Métricas de Utilização (dados de referência)
- 61 utilizadores registados, taxa de onboarding 87%
- 248 registos de formação (44% taxa de conclusão)
- 93 certificados processados (93% success rate da extração IA)
- 184 conversas com o assistente IA (média 6.7 mensagens/conversa)
- 4 plataformas LMS integradas (3 ativas)
- **Nota:** substituir pelos dados reais da plataforma em produção

#### 5.3 Performance e Qualidade
- Lighthouse score (PWA, performance, accessibility) — executar e documentar
- Tamanho do bundle (Vite build output)
- **Figura sugerida:** screenshot Lighthouse do relatório

#### 5.4 Avaliação da Solução
- Comparação com os objetivos definidos no Capítulo 1
- Feedback da Softinsa (se recolhido)

---

### CAPÍTULO 6 — Conclusão *(recomendado: 5-8 páginas)*

#### 6.1 Principais Resultados
- Plataforma web full-featured com 17 funcionalidades distintas
- Integração com IA generativa (RAG) para recomendações e chat
- PWA com suporte offline, push notifications e instalação nativa
- 3 roles com controlo de acesso distinto (USER, ADMIN, SERVICE_LINE_MANAGER)
- Internacionalização completa PT/EN

#### 6.2 Trabalho Futuro
1. **Streaming de chat em tempo real** — backend já suporta SSE (`/ai/chat/stream`), frontend usa versão síncrona
2. **Testes automatizados** — Vitest (unit) + Playwright (E2E); não há testes no repositório
3. **Internacionalização completa** — verificar chaves em falta em `en.json`
4. **Analytics avançado** — substituir dados mock do `AnalyticsTab` por dados reais em produção
5. **Modo colaborativo nas coleções** — atualmente apenas partilha por clipboard (Markdown)
6. **Mobile app nativa** — a PWA cobre o caso de uso básico; React Native seria mais performativo

---

## PASSO 4 — ESTADO DA ARTE PERSONALIZADO

### Plataformas LMS para Comparar
1. **Moodle** — open source, mais popular a nível académico; sem pesquisa multi-plataforma nem IA nativa
2. **Canvas LMS** — usado em contexto empresarial; melhor UX que Moodle; sem RAG
3. **Cornerstone OnDemand** — enterprise LMS com alguns módulos de recomendação; caro e fechado
4. **Degreed** — o mais próximo do Learning Hub; agrega múltiplas plataformas; sem extração de certificados por IA
5. **LinkedIn Learning** — integrado com perfil profissional; sem acesso API livre; sem gestão de certificados externos

**O que o Learning Hub faz diferente:**
- Extração automática de metadados de certificados por IA (diferenciador forte)
- @mention de cursos específicos no contexto do chat IA
- Três níveis de gestão (USER, ADMIN, SERVICE_LINE_MANAGER) adaptados à estrutura Softinsa
- Calendário de eventos com notificações push integradas

### Conceitos Teóricos Relevantes
- **RAG (Retrieval-Augmented Generation)** — core do motor IA
- **PWA & Web APIs** (Service Workers, Push API, Web Share API)
- **Role-Based Access Control (RBAC)**
- **Design System e Atomic Design** (estrutura shadcn/ui)
- **Server State Management** (TanStack Query vs Redux)

### Papers e Autores de Referência (APA 7ª ed.)

| Área | Referência |
|------|-----------|
| RAG | Lewis, P., Perez, E., Piktus, A., Petroni, F., Karpukhin, V., Goyal, N., ... Kiela, D. (2020). Retrieval-augmented generation for knowledge-intensive NLP tasks. *Advances in Neural Information Processing Systems, 33*, 9459–9474. |
| RAG Survey | Gao, Y., Xiong, Y., Gao, X., Jia, K., Pan, J., Bi, Y., ... Wang, H. (2023). Retrieval-augmented generation for large language models: A survey. *arXiv preprint arXiv:2312.10997.* |
| PWA | Biørn-Hansen, A., Majchrzak, T. A., & Grønli, T. (2017). Progressive web apps: The possible web-native unifier for mobile development. *Proceedings of the 13th International Conference on Web Information Systems and Technologies* (pp. 344–351). SCITEPRESS. |
| LMS comparison | Cavus, N. (2010). The evaluation of Learning Management Systems using an artificial intelligence fuzzy logic algorithm. *Procedia Social and Behavioral Sciences, 2*(2), 2846–2850. https://doi.org/10.1016/j.sbspro.2010.03.428 |
| Corporate e-learning | Cross, J. (2006). *Informal learning: Rediscovering the natural pathways that inspire innovation and performance.* Pfeiffer. |
| Design systems | Fessenden, T. (2021). *Design systems 101.* Nielsen Norman Group. https://www.nngroup.com/articles/design-systems-101/ |
| Service Workers | Gaunt, M., & Kinlan, P. (2023). *Service workers: An introduction.* web.dev. https://web.dev/service-workers-basics/ |

---

## PASSO 5 — LISTA DE TAREFAS PRIORITÁRIAS

| # | Tarefa | Onde no Relatório | Tempo estimado |
|---|--------|-------------------|----------------|
| 1 | **Correr o projeto e tirar screenshots** de todas as páginas principais (dashboard, search, chat, certificados, admin, mobile) | Cap. 4 e 5 (figuras) | 2-3h |
| 2 | **Redigir Capítulo 3** (tecnologias) — material completo neste ficheiro | Cap. 3 | 4-6h |
| 3 | **Redigir Capítulo 4** (implementação) — secções por funcionalidade | Cap. 4 | 8-12h |
| 4 | **Pesquisar e ler os papers de RAG** (Lewis et al. 2020, Gao et al. 2023) | Cap. 2.3 | 3-4h |
| 5 | **Redigir Capítulo 2** (estado da arte) | Cap. 2 | 6-8h |
| 6 | **Criar os diagramas UML/arquitetura** (fluxo auth, diagrama de componentes, sequência de upload) | Caps. 3 e 4 | 3-4h |
| 7 | **Correr Lighthouse** na aplicação e guardar o relatório | Cap. 5.3 | 1h |
| 8 | **Confirmar dados reais** de utilização com a Softinsa (substituir mocks do AnalyticsTab) | Cap. 5.2 | 1-2h |
| 9 | **Redigir Capítulo 1** (introdução, objetivos) | Cap. 1 | 2-3h |
| 10 | **Redigir Capítulo 5** (resultados) | Cap. 5 | 2-3h |
| 11 | **Redigir Capítulo 6** (conclusão + trabalho futuro) | Cap. 6 | 2h |
| 12 | **Criar lista de acrónimos, índice de figuras, índice de tabelas** | Prefácio | 1h |
| 13 | **Verificar citações APA 7ª ed.** em todo o documento (Zotero recomendado) | Todo | 2-3h |
| 14 | **Revisão final e formatação** (paginação, legendas automáticas Word/LaTeX) | Todo | 3-4h |

**Total estimado:** 40-60h de trabalho, distribuíveis em 3-4 semanas com ritmo razoável.

---

> **Dica de escrita:** Usa sempre o estilo impessoal no passado: "desenvolveu-se", "implementou-se", "optou-se por", "verificou-se que". Para figuras: *Figura X — [Descrição]. Fonte: elaboração própria.* Para código citado no texto: usa blocos `monospace` com legenda de figura.
