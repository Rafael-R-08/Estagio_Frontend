# LearningHub Softinsa — Frontend

Plataforma inteligente de agregação e recomendação de formações para os colaboradores da Softinsa.

---

## Índice

- [Tecnologias](#tecnologias)
- [Arquitetura](#arquitetura)
- [Pré-requisitos](#pré-requisitos)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Correr o frontend (Windows)](#correr-o-frontend-windows)
- [Correr o backend (WSL)](#correr-o-backend-wsl)
- [Correr com Docker](#correr-com-docker)
- [CI/CD](#cicd)

---

## Tecnologias

| Categoria         | Tecnologia                                    |
|-------------------|-----------------------------------------------|
| Framework         | React 19 + TypeScript                         |
| Build tool        | Vite 7                                        |
| Estilos           | Tailwind CSS 3                                |
| Componentes UI    | shadcn/ui (Radix UI)                          |
| Estado servidor   | TanStack React Query 5                        |
| Routing           | React Router 7                                |
| HTTP              | Axios                                         |
| Formulários       | React Hook Form + Zod                         |
| Notificações      | Sonner                                        |
| Ícones            | Lucide React                                  |
| Datas             | date-fns                                      |
| PWA               | vite-plugin-pwa                               |
| Linting           | ESLint + typescript-eslint                    |

---

## Arquitetura

```
src/
├── app/            # Router e route guards (ProtectedRoute)
├── assets/         # Imagens e recursos estáticos
├── components/ui/  # Componentes base reutilizáveis (shadcn/ui)
├── constants/      # Constantes globais
├── features/       # Módulos por domínio de negócio
│   ├── ai-assistant/
│   ├── auth/
│   ├── certificates/
│   ├── dashboard/
│   ├── my-learning/
│   ├── profile/
│   └── search/
├── layout/         # Shell da app (AppLayout, Sidebar, Header)
├── lib/            # Clientes HTTP, query client, utilitários
├── pages/          # Páginas fora de domínio (Admin, Platforms)
├── services/       # Serviços de API centralizados
└── types/          # Tipos TypeScript globais
```

Cada feature segue a estrutura `components/`, `pages/`, `hooks/`, `context/` conforme necessário, mantendo a lógica isolada por domínio.

---

## Pré-requisitos

- **Node.js** >= 20
- **npm** >= 10
- Backend em execução (ver secção abaixo)

---

## Variáveis de ambiente

Cria um ficheiro `.env` na raiz do projeto (já existe um `.env` de exemplo):

```env
VITE_API_URL=http://localhost:3000/api
```

> Em produção, substitui pelo URL do backend em produção.

---

## Correr o frontend (Windows)

```powershell
# Instalar dependências
npm ci

# Iniciar servidor de desenvolvimento
npm run dev
```

A aplicação fica disponível em `http://localhost:5173`.

Outros comandos úteis:

```powershell
npm run build      # Build de produção (TypeScript + Vite)
npm run preview    # Pré-visualizar o build de produção
npm run lint       # Correr o linter
```

---

## Correr o backend (WSL)

O backend é um projeto NestJS separado. Para o correr em WSL:

```bash
# Dentro do WSL, na pasta do backend
cd /home/<user>/learninghub-softinsa-backend

# Instalar dependências
npm ci

# Copiar variáveis de ambiente
cp .env.example .env

# Migrar a base de dados
npx prisma migrate deploy

# Iniciar o servidor
npm run start:dev
```

O backend fica disponível em `http://localhost:3000`.

> Certifica-te que o `VITE_API_URL` no frontend aponta para este endereço.

### Migrar a base de dados

```bash
# Aplicar migrações pendentes
npx prisma migrate deploy

# Gerar o cliente Prisma após alterações no schema
npx prisma generate

# (Opcional) Seed de dados iniciais
npx prisma db seed
```

---

## Correr com Docker

O `docker-compose.yml` está no repositório do backend e levanta todos os serviços:

```bash
# Na pasta raiz do backend
docker compose up --build
```

Serviços iniciados:
- **frontend** — `http://localhost:5173`
- **backend** — `http://localhost:3000`
- **PostgreSQL** — `localhost:5432`

> Para parar: `docker compose down`  
> Para parar e apagar volumes: `docker compose down -v`

---

## CI/CD

O projeto usa **Bitbucket Pipelines** com a seguinte estratégia:

| Trigger              | Pipeline              |
|----------------------|-----------------------|
| Qualquer branch      | Build                 |
| Pull Request (`**`)  | Lint + Build          |
| Branch `dev`         | Dev Build             |
| Branch `QA`          | QA Build              |
| Branch `main`        | Production Build      |

Consulta [bitbucket-pipelines.yml](./bitbucket-pipelines.yml) para detalhes.

---

> Para guias de contribuição, convenções de commits e processo de Pull Request, consulta o [CONTRIBUTING.md](./CONTRIBUTING.md).
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
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
