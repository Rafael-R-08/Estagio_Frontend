# Guia de Contribuição — LearningHub Softinsa Frontend

---

## Índice

- [Estrutura de branches](#estrutura-de-branches)
- [Conventional Commits](#conventional-commits)
- [Processo de Pull Request](#processo-de-pull-request)
- [Regras de QA](#regras-de-qa)

---

## Estrutura de branches

```
main
 └── QA
      └── dev
           └── feature/nome-da-feature
           └── fix/nome-do-bug
           └── chore/nome-da-tarefa
```

| Branch               | Propósito                                              |
|----------------------|--------------------------------------------------------|
| `main`               | Produção. Código estável e validado.                   |
| `QA`                 | Ambiente de qualidade/testes. Merges vindos de `dev`.  |
| `dev`                | Integração contínua. Merges de features/fixes.         |
| `feature/*`          | Nova funcionalidade.                                   |
| `fix/*`              | Correção de bug.                                       |
| `chore/*`            | Tarefas de manutenção (dependências, config, CI, etc). |
| `docs/*`             | Alterações de documentação.                            |
| `refactor/*`         | Refactoring sem alteração de comportamento.            |

**Regras:**
- Nunca fazer commit diretamente em `main`, `QA` ou `dev`.
- Branches de trabalho partem sempre de `dev`.
- O fluxo de promoção é sempre: `dev` → `QA` → `main`.

---

## Conventional Commits

Todos os commits devem seguir o standard [Conventional Commits](https://www.conventionalcommits.org/):

```
<tipo>(<escopo opcional>): <descrição curta>

[corpo opcional]

[rodapé opcional]
```

### Tipos permitidos

| Tipo       | Quando usar                                                  |
|------------|--------------------------------------------------------------|
| `feat`     | Nova funcionalidade visível ao utilizador                    |
| `fix`      | Correção de um bug                                           |
| `chore`    | Manutenção (dependências, scripts, config)                   |
| `docs`     | Alterações em documentação                                   |
| `style`    | Formatação, espaços, ponto e vírgula (sem lógica alterada)   |
| `refactor` | Refactoring sem mudança de comportamento                     |
| `test`     | Adição ou correção de testes                                 |
| `perf`     | Melhoria de performance                                      |
| `ci`       | Alterações no pipeline CI/CD                                 |
| `revert`   | Reverter um commit anterior                                  |

### Exemplos

```
feat(auth): adicionar fluxo de reset de password
fix(dashboard): corrigir contagem de certificados expirados
chore(deps): atualizar react-query para v5.90
docs(readme): adicionar secção de variáveis de ambiente
ci(pipelines): adicionar step de lint ao pipeline de QA
refactor(search): extrair lógica de filtros para hook dedicado
```

**Regras:**
- A descrição deve estar em **português** ou **inglês** (escolher um e ser consistente no PR).
- Máximo de 72 caracteres na linha de cabeçalho.
- Usar o imperativo: "adicionar" em vez de "adicionado" ou "adicionei".
- Breaking changes devem incluir `BREAKING CHANGE:` no rodapé.

---

## Processo de Pull Request

### 1. Antes de abrir o PR

- [ ] O código compila sem erros: `npm run build`
- [ ] O lint passa sem erros: `npm run lint`
- [ ] A feature foi testada manualmente no browser
- [ ] Não existem `console.log` ou código comentado esquecido
- [ ] As variáveis de ambiente novas estão documentadas no `README.md`

### 2. Criar o PR

- **Base branch:** `dev` (ou `QA` se for um hotfix de QA)
- **Título:** seguir o formato Conventional Commits (ex: `feat(profile): adicionar upload de avatar`)
- **Descrição:** preencher o template com:
  - O que foi feito
  - Como testar
  - Screenshots (se houver alterações visuais)
  - Issues relacionadas (ex: `Closes #42`)

### 3. Revisão

- Mínimo de **1 aprovação** para merge em `dev`
- Mínimo de **2 aprovações** para merge em `QA` ou `main`
- O autor não pode aprovar o seu próprio PR
- Comentários do tipo `nit:` são sugestões opcionais; os restantes são obrigatórios

### 4. Merge

- Usar **Squash and Merge** para features e fixes (mantém o histórico limpo)
- Usar **Merge Commit** para promoções `dev` → `QA` → `main`
- Apagar a branch após o merge

---

## Regras de QA

### Promoção de `dev` para `QA`

- O pipeline de `dev` deve estar verde (build a passar)
- Todas as features do sprint devem estar integradas em `dev`
- Criar um PR de `dev` → `QA` com a descrição das alterações incluídas
- Validar no ambiente de QA antes de promover para `main`

### Checklist de QA

Antes de aprovar a promoção `QA` → `main`:

- [ ] Todos os fluxos principais foram testados manualmente
  - [ ] Login / Logout
  - [ ] Registo e onboarding
  - [ ] Dashboard carrega corretamente
  - [ ] Pesquisa de cursos e filtros
  - [ ] Certificados (listagem, upload, detalhe)
  - [ ] Perfil (edição, tags)
  - [ ] AI Assistant
  - [ ] My Learning (plano, histórico)
- [ ] Sem erros de consola em produção (`npm run build && npm run preview`)
- [ ] Comportamento responsivo validado (mobile e desktop)
- [ ] Sem regressões visíveis face à versão anterior

### Hotfixes em QA ou main

Se for necessário corrigir um bug crítico diretamente em `QA` ou `main`:

1. Criar branch `fix/nome-do-bug` a partir da branch afetada
2. Desenvolver e testar a correção
3. PR para a branch afetada com aprovação de 2 revisores
4. Fazer backport para `dev` (cherry-pick ou PR separado)
