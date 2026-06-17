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
- [ ] Tour inicial (conteúdo PT-BR versionado): blocos, ler/escutar, oração, anotações, árvore/streak, ativar lembretes, instalar PWA no iPhone, validar WhatsApp.
- [ ] Flag `onboardingCompletedAt`; permitir rever.

## M10 — Observabilidade & LGPD
- [ ] Logs estruturados; alertas nos jobs críticos (publicação 00h, notificações) e na sessão do WhatsApp.
- [ ] Exclusão de conta + dados (LGPD).

## v2 (depois)
- Dashboard analítico do admin (cobertura da Bíblia, passagens mais repetidas, rankings, uso) sobre os dados já coletados.
- Migrar para Node 26 LTS (out/2026) e adotar a Temporal API no cálculo de dia lógico.
