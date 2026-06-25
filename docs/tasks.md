# Plano de execução

Tarefas pequenas e verificáveis, em ordem. Comece pela espinha de maior risco (M2), não pela UI bonita. Cada tarefa de regra de domínio começa **pelo teste**. Marque `[x]` ao concluir com testes passando.

> Convenção: código/identificadores/schema em **inglês**; conteúdo de usuário em **português**. Ver `CLAUDE.md`.

## M0 — Fundação
- [x] Monorepo pnpm com workspaces: `packages/{shared,api,pwa,admin}`.
- [x] TypeScript strict em todos os pacotes; configs base compartilhadas.
- [x] `shared`: setup do pacote (exporta schemas Zod + tipos).
- [x] `api`: Fastify rodando, healthcheck, estrutura DDD-lite (domain/application/infrastructure/delivery).
- [x] Prisma + Postgres conectados; primeira migration vazia.
- [x] Vitest configurado nos pacotes; Testcontainers para integração.
- [x] CI rodando `pnpm test` desde já (Docker disponível no runner).
- [x] `.editorconfig`, ESLint 9 flat config + Prettier (papéis separados; `eslint-config-prettier`), import sort (`simple-import-sort`), `.vscode/settings.json` com fix-on-save, hooks de pre-commit (lint-staged) rodando lint+format+typecheck.
- [x] CI bloqueia PR em falha de typecheck, lint, `prettier --check` e testes.

## M1 — Identidade & convites
- [x] Schema: `User` (com `timezone`, `role`, `onboardingCompletedAt`), `Invite`.
- [x] Auth por sessão com cookie httpOnly (login, logout, revogação).
- [x] Middleware de papel; rotas `/admin` protegidas (só `admin`).
- [x] Fluxo de convite: admin gera convite; cadastro só com convite válido.
- [x] Testes: unit das regras de convite/expiração; integração do fluxo de auth.

## M2 — Espinha de maior risco: dia lógico + streak + sync offline
> **Aqui mora o risco do produto. TDD rigoroso.**
- [x] **Teste primeiro**: `logicalDate(timestamp, timezone)` — limites 23:59/00:01, fusos diferentes.
- [x] Implementar `logicalDate` como função pura.
- [x] **Teste primeiro**: `evaluateStreak(state, completion)` — incremento, quebra ao pular dia, reset no limite, dois envios idempotentes não duplicam.
- [x] Implementar a máquina de estado do streak (pura).
- [x] **Teste primeiro**: regras de `treeStage` por streak (estágios e murcha ao zerar).
- [x] **Teste primeiro**: concessão de insígnia semanal (cada 7) e prêmio mensal (cada 30); permanência ao quebrar streak.
- [x] Implementar gamificação (domínio puro).
- [x] Schema: `DailyCompletion` (com `logicalDate` + `idempotencyKey` único por user+dia), `StreakState`, `Achievement`.
- [x] Use-case `completeDevotional`: valida no servidor, atualiza streak/árvore/conquistas. Integração contra Postgres.
- [x] Endpoint de sync: recebe fila de conclusões offline com `idempotencyKey`; reconcilia.

## M3 — Base bíblica + seletor
- [x] Schema: `Translation`, `Book` (com `bookReferenceId`, `testamentReferenceId`), `Verse`.
- [x] Importador dos SQLs (multi-tradução) — script idempotente.
- [x] API do seletor: listar livros (por testamento), capítulos de um livro, versículos de um range.
- [x] Montagem de texto a partir de uma `PassageReference`.
- [x] Admin: seletor encadeado tradução → livro → capítulo → range, com preview.
- [x] Testes: integração das queries do seletor e da montagem de texto.

## M4 — Conteúdo + admin de autoria
- [x] Schema: `Devotional` (por `date`), `DevotionalBlock` (tipos: quote/passage/devotional/prayer/reflection), `Media`, `PassageReference`.
- [x] Bloco `reflection` carrega 3 perguntas + 3 ações.
- [x] Upload de mídia (áudio por bloco; gif + som da oração) → storage em disco atrás de interface.
- [x] Admin: formulário de montagem do devocional (RHF + Zod).
- [x] Job de publicação 00h (in-process, ex. node-cron) torna o conteúdo da data disponível; log + alerta em falha.
- [x] Testes: integração da criação de devocional e da publicação agendada.

## M5 — Tela "Hoje" (PWA do fiel)
- [x] Service worker (Workbox): cacheia app shell + devocional do dia (texto da passagem já montado) + mídias.
- [x] Blocos em sequência; passagem em card (cards navegáveis estilo stories: simplificado p/ um card no v1).
- [x] Ler/escutar por bloco: ao escutar, texto do bloco visível acompanha o áudio (sem sync palavra-a-palavra — confirmado).
- [x] Oração: gif/animação de fundo + som tranquilo em loop (decidido: ducking — abaixa o fundo na narração).
- [x] Conclusão do dia → enfileira localmente → sync (M2).
- [x] Fila offline de ações com `idempotencyKey`; reconcilia ao reconectar.

## M6 — Anotações + biblioteca pessoal
- [x] Schema: `Note` (por user+devotional, soft delete, `idempotencyKey`).
- [x] CRUD de anotação, offline-capable.
- [x] Biblioteca pessoal: lista das próprias anotações por data.
- [x] Testes: integração do CRUD e do sync de anotações.

## M7 — Gamificação visual
- [x] Árvore por estágios (semente → ... → frutos), reflete `StreakState`.
- [x] Murcha/volta à semente ao quebrar streak.
- [x] Coleção permanente de insígnias e prêmios.

## M8 — Notificações multi-canal
- [x] Schema: `PushSubscription`, `WhatsappContact` (com verificação), `ReminderPreference` (horário + canais ativos).
- [x] Web Push (VAPID): registro de subscription, disparo pelo servidor.
- [x] WhatsApp atrás de `NotificationChannel`: adapter stub best-effort (lib não-oficial/chip dedicado depois, sem tocar no núcleo).
- [x] Fluxo de verificação de número (código → confirma → ativa).
- [x] Job periódico de disparo por horário no fuso de cada usuário; log + alerta.

## M9 — Onboarding
- [x] Tour inicial (conteúdo PT-BR versionado): blocos, ler/escutar, oração, anotações, árvore/streak, ativar lembretes, instalar PWA no iPhone, validar WhatsApp.
- [x] Flag `onboardingCompletedAt`; permitir rever.

## M10 — Observabilidade & LGPD
- [x] Logs estruturados; alertas nos jobs críticos (publicação 00h, notificações) e na sessão do WhatsApp.
- [x] Exclusão de conta + dados (LGPD).

## M11 — Admin moderno: Markdown, dashboards e restyle
> Decisões nesta milestone vieram de uma sessão de design (grilling). Resumo das regras abaixo.
>
> **Markdown**: CommonMark + GFM completo via `react-markdown` + `remark-gfm`. HTML cru DESLIGADO (sem `rehype-raw`). Imagem inline BLOQUEADA (mídia só por upload). Links abrem em nova aba (`rel="noopener noreferrer"`). Componente `<Markdown>` no pacote novo `packages/ui` (React compartilhado pwa↔admin) — NÃO em `shared` (só Zod). "Stories" (um por tela) só na passagem bíblica; devocional é uma tela com scroll.
>
> **Cobertura (Grupo A)**: régua = contagem real de versículos da tradução **ACF** no banco. Dedup por (livro, capítulo, versículo), ignora tradução. Período: tudo.
>
> **Engajamento (Grupo B)**: tudo agregado, nunca nominal. Ativo = concluiu nos últimos 7 dias. Taxa de conclusão diária = conclusões ÷ todos os usuários cadastrados, com médias móveis de 7 e 30 dias. Retenção = semana-a-semana (concluiu esta semana e a passada). "Devocional mais concluído" via `devotionalId`; conclusões sem id são ignoradas.

### Fatia 0 — `packages/ui` + Markdown
- [x] Criar pacote `packages/ui` (React + TS strict) no workspace; deps `react-markdown` + `remark-gfm`.
- [x] **Teste primeiro**: `<Markdown>` renderiza títulos, listas (incl. numeradas), tabelas GFM, citações, código, `---`, negrito/itálico; **não** renderiza imagem inline; links recebem `target="_blank"` + `rel="noopener noreferrer"`; sem HTML cru.
- [x] Implementar `<Markdown>` (CommonMark + GFM, img off, links seguros).
- [x] PWA: trocar o renderizador artesanal pelo de `packages/ui` no devocional; aplicar render MD na `PrayerScreen`.

### Fatia L — Limpeza de lint (à parte)
- [x] Adicionar artefatos gerados/descartáveis ao `ignores` do ESLint (`**/.vite/`, `**/dev-dist/`, `prototypes/`) — `eslint .` voltou a passar limpo (de ~2010 erros para 0).

### Fatia 1 — Restyle admin + preview MD
- [x] Editor: preview lado-a-lado (fonte → render) nos campos Devocional e Oração, com tipografia de leitura nos tokens existentes.
- [x] Unificar visual com a PWA: admin adota a paleta `claro`/`escuro` da PWA (musgo + clay sobre papel) e a tipografia (Fraunces display + Mulish body), mantendo a densidade desktop.
- [x] Reduzir os dois apps a apenas light (`claro`, padrão) e dark (`escuro`); PWA perde `aconchego`/`sereno`.

### Fatia 2 — Dashboard cobertura (Grupo A)
- [x] `shared`: `coverageStatsSchema` (Zod) da resposta.
- [x] Domínio puro `canon` (testamento + seção por bookReferenceId) com testes.
- [x] **Teste primeiro** (integração, Postgres real): use-case `computeCoverageStats` — % coberta (vs versículos ACF), heatmap livro×capítulo, balanço AT×NT, distribuição por seção, top 5 livros/referências, livros nunca usados. Dedup por (livro, capítulo, versículo) e range expandido.
- [x] Repo Prisma + rota admin-only `GET /admin/stats/coverage`; guard 401/403 testado.
- [x] Admin: tela de dashboard de cobertura + heatmap (paleta/tipografia unificadas).

### Fatia 3 — Dashboard engajamento (Grupo B)
- [x] `shared`: `engagementStatsSchema` (Zod) da resposta.
- [x] Domínio puro `dateWindow` (addDays + lastNDates) com testes.
- [x] **Teste primeiro** (integração, Postgres real): use-case `computeEngagementStats` — ativos 7d, taxa de conclusão diária (médias 7d/30d), retenção semana-a-semana, devocional mais concluído (ignora `devotionalId` nulo), streak médio/maior. Tudo agregado; `today` injetado para determinismo.
- [x] Repo Prisma + rota admin-only `GET /admin/stats/engagement`; guard 401/403 testado.
- [x] Admin: cards de engajamento no dashboard (ativos, conclusão diária, retenção, streaks, mais concluídos).

## M12 — Gestão de convites, cadastro e pessoas
> Fecha o fluxo de cadastro fechado por convite (UI faltante) e adiciona a tela de pessoas para acompanhamento pastoral. Decisões nesta milestone: ver `@docs/design.md` ADR-009 (roster nominal com sinais leves, estreita "nunca nominal"), ADR-010 (ciclo de vida do convite: link `registerUrl`, e-mail que trava, revogação, quem resgatou) e ADR-011 (PWA ganha react-router). Termos em `@docs/glossary.md`.

### Fatia 1 — Backend: revogação, e-mail que trava, exposição de dados
- [x] **Teste primeiro** (domínio): `inviteAllowsEmail` (trava no e-mail quando o convite tem e-mail) e `canRevokeInvite` (só `PENDING`); `registerWithInvite` lança `INVITE_EMAIL_MISMATCH` no mismatch.
- [x] `InviteRepository.findById/revoke` + use-case `revokeInvite` (só `PENDING` → `REVOKED`; erro se `USED`/`REVOKED`). Integração (Postgres real).
- [x] Default de expiração do convite passa a **1 dia** (`createInviteRequestSchema`); mantém ajustável (1–365).
- [x] `shared`: `inviteSchema` ganha `registerUrl` e `usedBy` (`{ name, email } | null`); serializer monta `registerUrl` de `APP_URL` e popula `usedBy` via join `usedById`.
- [x] Rota admin-only `POST /admin/invites/:id/revoke`; guard 401/403 testado.

### Fatia 2 — Admin: tela de convites
- [x] Tela "Convites": formulário de geração (e-mail opcional, expira em N dias com default 1) + lista com status (Pendente/Expirado/Usado/Revogado), `usedBy` nos usados, botões "copiar link"/"copiar código" e "cancelar" (só em pendentes).
- [x] Item de navegação no admin; paleta/tipografia unificadas.

### Fatia 3 — PWA: roteador + cadastro
- [x] Instalar react-router no PWA; rotas públicas `/login` e `/register`, app autenticado no restante (`AuthedApp`); gate de auth no router (ADR-011).
- [x] Tela `/register`: lê `?code=` (pré-preenche), captura fuso via `Intl.DateTimeFormat().resolvedOptions().timeZone`, RHF + `registerRequestSchema`, mensagens PT-BR mapeadas na apresentação. Link "tenho um convite" no `/login`.

### Fatia 4 — Admin: tela de pessoas (roster)
- [x] `shared`: `rosterEntrySchema`/`rosterSchema` (por usuário: nome, email, entrou em, onboarding, streak atual, último dia concluído, concluiu hoje?, total).
- [x] **Teste primeiro** (integração, Postgres real): use-case `computeRoster`; "concluiu hoje?"/"último dia" no **fuso de cada usuário** (`logicalDate`); `now` injetado. Inclui só MEMBER (não lista o admin).
- [x] Repo Prisma (`getRosterUsers`) + rota admin-only `GET /admin/users`; guard 401/403 testado. **Read-only**.
- [x] Admin: tabela de pessoas (`PeopleScreen`, item de navegação; paleta/tipografia unificadas).
