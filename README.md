# LearningHub Softinsa — Frontend

Plataforma inteligente de agregação e recomendação de formações para os colaboradores da Softinsa. Permite pesquisar cursos em múltiplas plataformas externas, gerir certificados, acompanhar progressos, e obter recomendações personalizadas via IA.

---

## Índice

1. [Visão Geral do Projeto](#1-visão-geral-do-projeto)
2. [Stack Tecnológica](#2-stack-tecnológica)
3. [Arquitetura e Estrutura de Pastas](#3-arquitetura-e-estrutura-de-pastas)
4. [Módulos Funcionais](#4-módulos-funcionais)
5. [Pré-requisitos — O que instalar e onde obter](#5-pré-requisitos--o-que-instalar-e-onde-obter)
6. [Clonar o Repositório](#6-clonar-o-repositório)
7. [Configuração das Variáveis de Ambiente](#7-configuração-das-variáveis-de-ambiente)
8. [Instalar Dependências](#8-instalar-dependências)
9. [Correr o Frontend Localmente](#9-correr-o-frontend-localmente)
10. [Configurar e Correr o Backend](#10-configurar-e-correr-o-backend)
11. [Correr com Docker (alternativa)](#11-correr-com-docker-alternativa)
12. [Utilizadores e Papéis](#12-utilizadores-e-papéis)
13. [PWA — Progressive Web App](#13-pwa--progressive-web-app)
14. [Scripts Disponíveis](#14-scripts-disponíveis)
15. [Linting e Qualidade de Código](#15-linting-e-qualidade-de-código)
16. [CI/CD com Bitbucket Pipelines](#16-cicd-com-bitbucket-pipelines)
17. [Contribuição](#17-contribuição)
18. [Resolução de Problemas Comuns](#18-resolução-de-problemas-comuns)

---

## 1. Visão Geral do Projeto

O **LearningHub Softinsa** é uma Single Page Application (SPA) construída com React 19 e TypeScript. Funciona como o frontend de uma plataforma corporativa de aprendizagem que:

- Agrega cursos de múltiplas plataformas externas (Udemy, Coursera, etc.) através de uma API de pesquisa unificada.
- Fornece recomendações personalizadas de cursos usando IA (RAG + LLM).
- Permite gerir o progresso de formações e o ciclo de vida de certificados.
- Oferece um assistente de IA conversacional para suporte à aprendizagem.
- Disponibiliza funcionalidades de gestão para administradores e Service Line Managers.
- Pode ser instalada como PWA (Progressive Web App) em dispositivos móveis e desktop.

---

## 2. Stack Tecnológica

| Categoria           | Tecnologia / Biblioteca              | Versão   | Propósito                                      |
|---------------------|--------------------------------------|----------|------------------------------------------------|
| Framework           | React                                | ^19.2    | Biblioteca UI principal                        |
| Linguagem           | TypeScript                           | ~5.9     | Tipagem estática                               |
| Build Tool          | Vite                                 | ^7.3     | Servidor de dev e bundler de produção          |
| Estilos             | Tailwind CSS                         | ^3.4     | Utility-first CSS framework                    |
| Componentes UI      | shadcn/ui (Radix UI)                 | —        | Componentes acessíveis e estilizáveis          |
| Animações           | Framer Motion                        | ^12.38   | Animações de UI declarativas                   |
| Estado servidor     | TanStack React Query                 | ^5.90    | Cache e sincronização de dados do servidor     |
| Routing             | React Router DOM                     | ^7.13    | Navegação client-side                          |
| HTTP                | Axios                                | ^1.13    | Cliente HTTP com interceptors JWT              |
| Formulários         | React Hook Form + Zod                | ^7 + ^4  | Formulários performativos com validação        |
| Gráficos            | Recharts                             | ^3.8     | Dashboards e analytics                         |
| Drag & Drop         | @hello-pangea/dnd                    | ^18.0    | Ordenação por drag & drop                      |
| Notificações Toast  | Sonner                               | ^2.0     | Toasts/notificações na UI                      |
| Ícones              | Lucide React                         | ^0.575   | Biblioteca de ícones SVG                       |
| Datas               | date-fns                             | ^4.1     | Manipulação e formatação de datas              |
| Internacionalização | i18next + react-i18next              | ^25 + ^16| Suporte a PT/EN                                |
| Markdown            | react-markdown                       | ^10.1    | Renderização de Markdown no assistente de IA   |
| ZIP/Export          | JSZip                                | ^3.10    | Exportação de coleções em ZIP                  |
| Bandeiras           | flag-icons                           | ^7.5     | Bandeiras de países para i18n                  |
| PWA                 | vite-plugin-pwa                      | ^1.2     | Service worker e manifest PWA                  |
| Linting             | ESLint + typescript-eslint           | ^9 + ^8  | Análise estática de código                     |

---

## 3. Arquitetura e Estrutura de Pastas

O projeto segue uma arquitetura **feature-based** onde cada domínio de negócio é isolado na sua própria pasta dentro de `src/features/`.

```
src/
├── App.tsx                  # Raiz da aplicação (providers + router)
├── main.tsx                 # Entry point (ReactDOM.createRoot)
├── index.css                # Estilos globais + tokens Tailwind
├── sw.ts                    # Service worker custom (PWA)
│
├── app/
│   ├── ErrorBoundary.tsx    # Captura erros de renderização
│   └── ProtectedRoute.tsx   # Guard de rotas autenticadas
│
├── assets/                  # Imagens, logos, ícones estáticos
│
├── components/
│   └── ui/                  # Componentes base reutilizáveis (shadcn/ui)
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── form.tsx
│       ├── label.tsx
│       ├── radio-group.tsx
│       ├── table.tsx
│       └── tooltip.tsx
│
├── features/                # Módulos de negócio (ver secção 4)
│   ├── admin/
│   ├── ai-assistant/
│   ├── auth/
│   ├── certificates/
│   ├── collections/
│   ├── dashboard/
│   ├── landing/
│   ├── my-learning/
│   ├── onboarding/
│   ├── profile/
│   ├── reports/
│   ├── search/
│   ├── settings/
│   └── sl-manager/
│
├── hooks/
│   └── usePWAInstall.ts     # Hook para prompt de instalação PWA
│
├── i18n/
│   ├── index.ts             # Configuração do i18next
│   └── locales/
│       ├── en.json          # Traduções inglês
│       └── pt.json          # Traduções português
│
├── layout/
│   ├── AppLayout.tsx        # Shell principal da app autenticada
│   ├── BottomNav.tsx        # Navegação inferior (mobile)
│   ├── FloatingDock.tsx     # Dock flutuante (desktop)
│   └── Header.tsx           # Header com notificações e perfil
│
├── lib/
│   ├── api.ts               # Utilitários de normalização de respostas API
│   ├── axios.ts             # Instância Axios + interceptors JWT + retry
│   ├── collection-export.ts # Lógica de exportação de coleções
│   ├── queryClient.ts       # Configuração TanStack Query
│   ├── react-query.tsx      # Provider do QueryClient
│   ├── social.ts            # Partilha social
│   ├── storage.ts           # Abstração de localStorage (token, user, prefs)
│   ├── toast-store.ts       # Store global de toasts
│   ├── utils.ts             # Utilitários gerais (cn, formatters)
│   └── zip.ts               # Geração de ficheiros ZIP
│
├── services/
│   ├── api.ts               # Todos os endpoints da API centralizados
│   └── certificates.service.ts # Serviço dedicado a certificados
│
└── types/
    └── index.ts             # Tipos e interfaces TypeScript globais
```

**Convenção por feature:**
Cada pasta em `features/` pode conter:
```
features/<nome>/
├── components/   # Componentes específicos da feature
├── pages/        # Página(s) associadas (rota)
├── hooks/        # Custom hooks da feature
└── context/      # Context API (apenas se necessário)
```

---

## 4. Módulos Funcionais

| Módulo           | Caminho                        | Descrição                                                                 |
|------------------|--------------------------------|---------------------------------------------------------------------------|
| **Auth**         | `features/auth/`               | Login, logout, refresh token automático, onboarding inicial               |
| **Dashboard**    | `features/dashboard/`          | Visão geral: progresso, calendário, quick actions, alertas                |
| **Search**       | `features/search/`             | Pesquisa de cursos multi-plataforma com filtros avançados                 |
| **My Learning**  | `features/my-learning/`        | Formações do utilizador (ongoing, completed, priority, later)             |
| **Certificates** | `features/certificates/`       | Upload, gestão e visualização de certificados                             |
| **Collections**  | `features/collections/`        | Coleções personalizadas de cursos                                         |
| **AI Assistant** | `features/ai-assistant/`       | Chat com IA, recomendações personalizadas, planos de curso                |
| **Profile**      | `features/profile/`            | Perfil do utilizador, skills, níveis de experiência                       |
| **Settings**     | `features/settings/`           | Preferências de notificações, idioma, preferências de IA                  |
| **Reports**      | `features/reports/`            | Relatórios de aprendizagem pessoal                                        |
| **SL Manager**   | `features/sl-manager/`         | Gestão da service line (overview, utilizadores, alertas)                  |
| **Admin**        | `features/admin/`              | Gestão de utilizadores, plataformas, analytics e auditoria                |
| **Onboarding**   | `features/onboarding/`         | Fluxo de onboarding para novos utilizadores                               |
| **Landing**      | `features/landing/`            | Página pública de entrada (não autenticada)                               |

---

## 5. Pré-requisitos — O que instalar e onde obter

Antes de poder correr o projeto, é necessário ter os seguintes programas instalados na máquina.

### 5.1 Node.js (versão 20 ou superior)

**Onde obter:** https://nodejs.org/en/download

**Como instalar (Windows):**
1. Aceder a https://nodejs.org/en/download
2. Descarregar o instalador Windows `.msi` da versão **LTS mais recente** (mínimo v20).
3. Executar o instalador e seguir os passos (aceitar os termos, instalar com as opções padrão).
4. Abrir um terminal novo e verificar:
   ```powershell
   node --version   # deve mostrar v20.x.x ou superior
   npm --version    # deve mostrar 10.x.x ou superior
   ```

> **Alternativa recomendada para gerir múltiplas versões de Node:** usar o [nvm-windows](https://github.com/coreybutler/nvm-windows/releases).
> Descarregar o `nvm-setup.exe`, instalar, e depois:
> ```powershell
> nvm install 20
> nvm use 20
> ```

### 5.2 Git

**Onde obter:** https://git-scm.com/download/win

**Como instalar:**
1. Aceder a https://git-scm.com/download/win
2. O download inicia automaticamente. Executar o instalador.
3. Nas opções, manter os valores padrão (incluindo "Git from the command line and also from 3rd-party software").
4. Verificar a instalação:
   ```powershell
   git --version   # deve mostrar git version 2.x.x
   ```

### 5.3 Editor de Código — VS Code (recomendado)

**Onde obter:** https://code.visualstudio.com/

**Extensões recomendadas para este projeto:**
- **ESLint** (`dbaeumer.vscode-eslint`) — realça erros de linting em tempo real.
- **Tailwind CSS IntelliSense** (`bradlc.vscode-tailwindcss`) — autocomplete de classes Tailwind.
- **Prettier** (`esbenp.prettier-vscode`) — formatação de código (opcional mas recomendado).

### 5.4 Backend (NestJS)

O frontend consome uma API REST. É necessário ter o backend a correr localmente. Ver a [Secção 10](#10-configurar-e-correr-o-backend) para instruções detalhadas.

### 5.5 (Opcional) Docker Desktop

Necessário apenas se quiser correr tudo via Docker em vez de instalar Node/NestJS manualmente.

**Onde obter:** https://www.docker.com/products/docker-desktop/

---

## 6. Clonar o Repositório

```powershell
# Clonar o repositório (substituir <url> pelo URL do Bitbucket)
git clone <url-do-repositorio-bitbucket>

# Entrar na pasta do projeto
cd learninghub-softinsa-frontend
```

---

## 7. Configuração das Variáveis de Ambiente

O frontend usa variáveis de ambiente para saber onde está o backend e configurar funcionalidades opcionais. Estas variáveis são lidas pelo Vite no arranque e **devem ter o prefixo `VITE_`**.

### 7.1 Criar o ficheiro `.env`

Na raiz do projeto, criar um ficheiro chamado `.env`:

```powershell
# Na raiz do projeto
New-Item .env
```

Ou simplesmente criar o ficheiro manualmente no VS Code.

### 7.2 Conteúdo do ficheiro `.env`

```env
# ─── Obrigatório ──────────────────────────────────────────────────────────────

# URL base da API do backend.
# Em desenvolvimento local com backend na porta 3000:
VITE_API_URL=http://localhost:3000

# ─── Opcional (têm valores padrão definidos no código) ───────────────────────

# Caminho do endpoint de login (padrão: /auth/login)
VITE_AUTH_LOGIN_PATH=/auth/login

# Caminho do endpoint de refresh de token (padrão: /auth/refresh)
VITE_AUTH_REFRESH_PATH=/auth/refresh

# Caminho do endpoint do utilizador autenticado (padrão: /auth/me)
VITE_AUTH_ME_PATH=/auth/me

# Chave pública VAPID para push notifications (necessário para notificações web push)
# Gerada pelo backend — obter junto da equipa de backend ou nas settings do backend
VITE_VAPID_PUBLIC_KEY=<chave-vapid-publica-do-backend>
```

> **Nota de segurança:** O ficheiro `.env` **nunca deve ser committed** no repositório. Verificar que `.env` está no `.gitignore`.

> **Nota sobre o URL da API:** O Axios usa `VITE_API_URL` como `baseURL`. Os endpoints de serviço são adicionados a seguir (ex: `/auth/login`, `/courses`, etc.). Se o backend corre em `http://localhost:3000` e as rotas estão sob `/api`, usar `VITE_API_URL=http://localhost:3000/api`.

---

## 8. Instalar Dependências

Após clonar o repositório e criar o `.env`, instalar todas as dependências Node:

```powershell
# Na pasta raiz do projeto
npm ci
```

> Usar `npm ci` em vez de `npm install` garante que são instaladas exatamente as versões do `package-lock.json`, evitando inconsistências entre ambientes.

Após a instalação, a pasta `node_modules/` será criada com todas as dependências.

---

## 9. Correr o Frontend Localmente

Com as dependências instaladas e o `.env` configurado:

```powershell
npm run dev
```

O Vite irá compilar e iniciar o servidor de desenvolvimento. Deverás ver uma saída semelhante a:

```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
```

Abrir o browser em **http://localhost:5173**.

> O servidor de desenvolvimento tem **Hot Module Replacement (HMR)** ativo — as alterações ao código refletem-se instantaneamente no browser sem precisar de recarregar a página.

---

## 10. Configurar e Correr o Backend

O frontend não funciona sem o backend. O backend é um projeto **NestJS** separado com uma base de dados **PostgreSQL**.

### 10.1 Obter o repositório do backend

```powershell
# Clonar o repositório do backend (substituir <url> pelo URL correto)
git clone <url-do-repositorio-backend>
cd learninghub-softinsa-backend
```

### 10.2 Requisitos do backend

| Requisito      | Versão mínima | Onde obter                                      |
|----------------|---------------|-------------------------------------------------|
| Node.js        | >= 20         | https://nodejs.org                              |
| PostgreSQL      | >= 14         | https://www.postgresql.org/download/            |
| Redis (opcional)| >= 7         | https://redis.io/docs/getting-started/          |

**Instalar o PostgreSQL no Windows:**
1. Aceder a https://www.postgresql.org/download/windows/
2. Descarregar o instalador do EDB (EnterpriseDB).
3. Executar o instalador — anotar a **palavra-passe do utilizador `postgres`** definida durante a instalação.
4. O PostgreSQL fica disponível na porta `5432` por padrão.
5. Criar a base de dados para o projeto:
   ```powershell
   # Via psql (incluído na instalação do PostgreSQL)
   psql -U postgres
   # Dentro do psql:
   CREATE DATABASE learninghub;
   \q
   ```

**Alternativa simples com Docker apenas para a base de dados:**
```powershell
docker run --name learninghub-db -e POSTGRES_PASSWORD=password -e POSTGRES_DB=learninghub -p 5432:5432 -d postgres:16
```

### 10.3 Configurar o `.env` do backend

Na pasta do backend, copiar o ficheiro de exemplo e editar:

```powershell
copy .env.example .env
```

Preencher os valores essenciais no `.env` do backend:

```env
# Base de dados PostgreSQL
DATABASE_URL="postgresql://postgres:<password>@localhost:5432/learninghub"

# JWT — gerar strings aleatórias seguras
JWT_SECRET=<string-aleatoria-longa-e-segura>
JWT_REFRESH_SECRET=<outra-string-aleatoria-longa>

# Porta onde o backend vai escutar
PORT=3000
```

> Consultar a documentação do backend para a lista completa de variáveis (ex: chaves de API de plataformas externas, chaves VAPID, configuração de IA).

### 10.4 Instalar dependências do backend

```powershell
npm ci
```

### 10.5 Aplicar migrações da base de dados (Prisma)

O backend usa **Prisma ORM** para gerir o schema da base de dados.

```powershell
# Aplicar todas as migrações existentes à base de dados
npx prisma migrate deploy

# Gerar o cliente Prisma (necessário após alterações ao schema)
npx prisma generate

# (Opcional) Carregar dados iniciais de seed
npx prisma db seed
```

> Se for a primeira vez a correr o projeto, `prisma migrate deploy` criará todas as tabelas necessárias.

### 10.6 Iniciar o backend

```powershell
# Modo de desenvolvimento (com auto-reload)
npm run start:dev

# Modo de produção
npm run start:prod
```

O backend ficará disponível em **http://localhost:3000**.

Verificar que está a responder:
```powershell
# Deve retornar uma resposta (mesmo que seja 401 ou 404)
curl http://localhost:3000/auth/me
```

### 10.7 Confirmar a ligação frontend ↔ backend

Com o backend a correr, o frontend (em `http://localhost:5173`) deverá conseguir comunicar. Abrir o browser em `http://localhost:5173` e tentar fazer login. Se aparecer um erro de rede, verificar:

1. Se o `VITE_API_URL` no `.env` do frontend aponta para o endereço correto do backend.
2. Se o backend está de facto a correr (sem erros no terminal).
3. Se não há conflito de portas.

---

## 11. Correr com Docker (alternativa)

Se preferires não instalar Node.js e PostgreSQL manualmente, podes usar Docker para levantar todos os serviços de uma vez.

> O `docker-compose.yml` encontra-se no repositório do **backend**.

```powershell
# Na pasta raiz do backend
docker compose up --build
```

Este comando irá:
1. Construir as imagens Docker do frontend e do backend.
2. Iniciar um container PostgreSQL.
3. Aplicar as migrações da base de dados automaticamente.
4. Iniciar o backend e o frontend.

**URLs após o arranque:**
| Serviço      | URL                        |
|--------------|----------------------------|
| Frontend     | http://localhost:5173       |
| Backend API  | http://localhost:3000       |
| PostgreSQL   | localhost:5432              |

**Comandos úteis Docker:**
```powershell
# Parar todos os serviços
docker compose down

# Parar e apagar os volumes (base de dados incluída — ação destrutiva!)
docker compose down -v

# Ver logs em tempo real
docker compose logs -f

# Reiniciar apenas o backend
docker compose restart backend
```

---

## 12. Utilizadores e Papéis

A aplicação tem três papéis de utilizador, cada um com acesso a funcionalidades diferentes:

| Role                    | Constante                | Acesso                                                                 |
|-------------------------|--------------------------|------------------------------------------------------------------------|
| **Utilizador**          | `USER`                   | Dashboard, pesquisa, formações, certificados, IA, perfil, settings     |
| **Service Line Manager**| `SERVICE_LINE_MANAGER`   | Tudo do USER + gestão da sua service line (overview, equipa, alertas)  |
| **Administrador**       | `ADMIN`                  | Tudo + painel admin (utilizadores, plataformas, analytics, auditoria)  |

As **Service Lines** disponíveis são:
- `HYBRID_CLOUD` — Hybrid Cloud
- `DATA` — Data
- `BUSINESS_APPLICATIONS` — Business Applications
- `APPLICATION_OPERATIONS` — Application Operations
- `SOURCING_TALENT_MANAGEMENT` — Sourcing & Talent Management

> Para criar um utilizador administrador em desenvolvimento, usar o seed do Prisma ou atualizar diretamente na base de dados:
> ```sql
> UPDATE "User" SET role = 'ADMIN' WHERE email = 'teu@email.com';
> ```

---

## 13. PWA — Progressive Web App

O projeto está configurado como PWA com `vite-plugin-pwa`. Isto significa que pode ser instalado no dispositivo como uma aplicação nativa.

**Funcionalidades PWA ativas:**
- Service worker com cache de assets (estratégia `injectManifest`).
- Manifest com nome, ícones e cores da app.
- Prompt de instalação personalizado (`InstallPrompt.tsx`).
- Funciona em modo `standalone` (sem barra do browser).
- Suporte a push notifications (com VAPID key configurada).

**Durante o desenvolvimento**, o service worker está ativo (configurado com `devOptions.enabled: true`) para permitir testar a instalabilidade localmente.

**Para gerar os assets PWA** (ícones de vários tamanhos a partir do logo):
```powershell
npm run generate-pwa-assets
```
> Requer o ficheiro `src/assets/logo2.icon.png` como fonte.

---

## 14. Scripts Disponíveis

Todos os scripts são executados com `npm run <script>`:

| Script                | Comando                                        | Descrição                                         |
|-----------------------|------------------------------------------------|---------------------------------------------------|
| `dev`                 | `vite`                                         | Inicia o servidor de desenvolvimento (porta 5173) |
| `build`               | `tsc -b && vite build`                         | Compila TypeScript e faz o build de produção      |
| `preview`             | `vite preview`                                 | Serve o build de produção localmente              |
| `lint`                | `eslint . --ext .ts,.tsx`                      | Corre o linter em todos os ficheiros TS/TSX       |
| `generate-pwa-assets` | `pwa-assets-generator --preset minimal-2023 …` | Gera os ícones PWA a partir do logo               |

---

## 15. Linting e Qualidade de Código

O projeto usa **ESLint** com **typescript-eslint** configurado em modo estrito. As regras incluem:

- `typescript-eslint/recommended` — regras recomendadas para TypeScript.
- `eslint-plugin-react-hooks` — garante o correto uso dos hooks do React.
- `eslint-plugin-react-refresh` — compatibilidade com HMR do Vite.

**Verificar erros de linting:**
```powershell
npm run lint
```

**Configuração TypeScript estrita** (`tsconfig.app.json`):
- `strict: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `noFallthroughCasesInSwitch: true`

---

## 16. CI/CD com Bitbucket Pipelines

O projeto usa **Bitbucket Pipelines** com a seguinte estratégia de automação:

| Trigger                | Pipeline         | Passos                    |
|------------------------|------------------|---------------------------|
| Qualquer branch (push) | Default          | `npm ci` + `npm run build`|
| Pull Request (`**`)    | Lint + Build     | `npm ci` + lint + build   |
| Branch `dev`           | Dev Build        | `npm ci` + `npm run build`|
| Branch `QA`            | QA Build         | `npm ci` + `npm run build`|
| Branch `main`          | Production Build | `npm ci` + `npm run build`|

**Imagem Docker usada no CI:** `node:20`  
**Timeout máximo:** 20 minutos por pipeline

> Consultar [bitbucket-pipelines.yml](./bitbucket-pipelines.yml) para a configuração completa.

---

## 17. Contribuição

Ver [CONTRIBUTING.md](./CONTRIBUTING.md) para o guia completo. Resumo:

### Estrutura de branches
```
main → QA → dev → feature/nome-da-feature
                → fix/nome-do-bug
                → chore/nome-da-tarefa
```

**Regras importantes:**
- **Nunca** fazer commit diretamente em `main`, `QA` ou `dev`.
- Branches de trabalho partem **sempre** de `dev`.
- Fluxo de promoção: `dev` → `QA` → `main`.

### Conventional Commits
```
feat(modulo): descrição curta em imperativo
fix(auth): corrigir redirect após logout
chore(deps): atualizar react-query para v5.90
```

### Checklist antes de abrir PR
- [ ] `npm run build` passa sem erros
- [ ] `npm run lint` passa sem erros
- [ ] Feature testada manualmente no browser
- [ ] Sem `console.log` ou código comentado esquecido
- [ ] Variáveis de ambiente novas documentadas no `README.md`

---

## 18. Resolução de Problemas Comuns

### O browser mostra página em branco após login

Causas mais comuns:
1. **API retorna shape inesperado** — verificar se a resposta é um array ou objeto paginado `{ data: [] }`. Usar `toList()` de `src/lib/api.ts` para normalizar.
2. **Token inválido** — limpar o `localStorage` do browser (DevTools → Application → Local Storage → limpar tudo) e tentar novamente.
3. **Erro de TypeScript em runtime** — verificar a consola do browser por erros do tipo `Cannot read properties of undefined`.

### Erro `VITE_API_URL is not defined` ou pedidos a URL errada

Verificar:
1. O ficheiro `.env` existe na **raiz** do projeto (mesma pasta que `package.json`).
2. O nome da variável começa com `VITE_`.
3. Reiniciar o servidor de dev após criar ou alterar o `.env`:
   ```powershell
   # Parar o servidor (Ctrl+C) e reiniciar
   npm run dev
   ```

### Erro de CORS ao fazer pedidos ao backend

O backend precisa de ter o frontend (`http://localhost:5173`) na lista de origens permitidas (CORS). Verificar as configurações CORS no backend.

### `npm ci` falha com erros de peer dependencies

```powershell
# Forçar instalação ignorando conflitos de peer deps (último recurso)
npm ci --legacy-peer-deps
```

### Porta 5173 já está em uso

```powershell
# Correr em porta diferente
npx vite --port 3001
```

### A PWA não instala / service worker não ativa

Em desenvolvimento, o service worker está ativo mas pode ser instável. Para testar a instalação PWA corretamente, usar o build de produção:
```powershell
npm run build
npm run preview
```
Abrir `http://localhost:4173` e tentar instalar.

---

> Para guias de contribuição, convenções de commits e processo de Pull Request, consultar o [CONTRIBUTING.md](./CONTRIBUTING.md).
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
