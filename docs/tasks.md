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
- [ ] Schema: `Translation`, `Book` (com `bookReferenceId`, `testamentReferenceId`), `Verse`.
- [ ] Importador dos SQLs (multi-tradução) — script idempotente.
- [ ] API do seletor: listar livros (por testamento), capítulos de um livro, versículos de um range.
- [ ] Montagem de texto a partir de uma `PassageReference`.
- [ ] Admin: seletor encadeado tradução → livro → capítulo → range, com preview.
- [ ] Testes: integração das queries do seletor e da montagem de texto.

## M4 — Conteúdo + admin de autoria
- [ ] Schema: `Devotional` (por `date`), `DevotionalBlock` (tipos: quote/passage/devotional/prayer/reflection), `Media`, `PassageReference`.
- [ ] Bloco `reflection` carrega 3 perguntas + 3 ações.
- [ ] Upload de mídia (áudio por bloco; gif + som da oração) → storage em disco atrás de interface.
- [ ] Admin: formulário de montagem do devocional (RHF + Zod).
- [ ] Job de publicação 00h (in-process, ex. node-cron) torna o conteúdo da data disponível; log + alerta em falha.
- [ ] Testes: integração da criação de devocional e da publicação agendada.

## M5 — Tela "Hoje" (PWA do fiel)
- [ ] Service worker (Workbox): cacheia app shell + devocional do dia (texto da passagem já montado) + mídias.
- [ ] Blocos em sequência; passagem em cards navegáveis (estilo stories).
- [ ] Ler/escutar por bloco: ao escutar, texto do bloco visível acompanha o áudio (sem sync palavra-a-palavra — confirmar).
- [ ] Oração: gif/animação de fundo + som tranquilo em loop (decidir mix vs. abaixar quando há narração).
- [ ] Conclusão do dia → enfileira localmente → sync (M2).
- [ ] Fila offline de ações com `idempotencyKey`; reconcilia ao reconectar.

## M6 — Anotações + biblioteca pessoal
- [ ] Schema: `Note` (por user+devotional, soft delete, `idempotencyKey`).
- [ ] CRUD de anotação, offline-capable.
- [ ] Biblioteca pessoal: lista das próprias anotações por data.
- [ ] Testes: integração do CRUD e do sync de anotações.

## M7 — Gamificação visual
- [ ] Árvore por estágios (semente → ... → frutos), reflete `StreakState`.
- [ ] Murcha/volta à semente ao quebrar streak.
- [ ] Coleção permanente de insígnias e prêmios.

## M8 — Notificações multi-canal
- [ ] Schema: `PushSubscription`, `WhatsappContact` (com verificação), `ReminderPreference` (horário + canais ativos).
- [ ] Web Push (VAPID): registro de subscription, disparo pelo servidor.
- [ ] WhatsApp atrás de `NotificationChannel`: lib não-oficial, chip dedicado, disparos espaçados, best-effort.
- [ ] Fluxo de verificação de número (código → confirma → ativa).
- [ ] Job periódico de disparo por horário no fuso de cada usuário; log + alerta.

## M9 — Onboarding
- [ ] Tour inicial (conteúdo PT-BR versionado): blocos, ler/escutar, oração, anotações, árvore/streak, ativar lembretes, instalar PWA no iPhone, validar WhatsApp.
- [ ] Flag `onboardingCompletedAt`; permitir rever.

## M10 — Observabilidade & LGPD
- [ ] Logs estruturados; alertas nos jobs críticos (publicação 00h, notificações) e na sessão do WhatsApp.
- [ ] Exclusão de conta + dados (LGPD).

## v2 (depois)
- Dashboard analítico do admin (cobertura da Bíblia, passagens mais repetidas, rankings, uso) sobre os dados já coletados.
- Migrar para Node 26 LTS (out/2026) e adotar a Temporal API no cálculo de dia lógico.
