# Devocional — Projeto Claude Code

App devocional (estilo Glorify) para uma igreja/grupo. PWA mobile-first/offline-first para o fiel + painel web desktop para o admin (Vitor, único autor). O **porquê** de cada decisão está em `@docs/design.md` — consulte-o quando precisar de contexto arquitetural. Este arquivo são as **regras de execução**.

## Convenção de idioma (INEGOCIÁVEL)
- **Código em inglês**: identificadores (variáveis, funções, tipos, arquivos, pastas), schema do banco inteiro (tabelas, colunas, enums, constraints, migrations), rotas e campos de payload JSON, chaves de schemas Zod, mensagens de commit, comentários, nomes de branch.
- **Português** apenas no que o usuário final lê/ouve: conteúdo devocional, textos de UI, mensagens de notificação (push/WhatsApp), copy de onboarding.
- **Erros de validação**: o schema Zod compartilhado define a regra; a mensagem PT-BR exibida ao fiel é mapeada na camada de apresentação (front). NÃO espalhar strings PT-BR dentro do schema compartilhado.

## Stack
- **Runtime**: Node.js 24 LTS. **Linguagem**: TypeScript strict em tudo.
- **Backend**: Fastify (schema-first). **Dados**: Prisma + PostgreSQL.
- **Frontends**: React + TypeScript + Vite. PWA do fiel usa Workbox (service worker/offline). Admin é desktop-only, sem PWA/offline.
- **Validação**: Zod em TODA validação. **Forms**: React Hook Form com `@hookform/resolvers/zod` em TODO formulário. Sem validação manual ad-hoc.
- **Monorepo**: pnpm workspaces. **Auth**: sessão com cookie httpOnly (revogável).
- **Testes**: Vitest (unit) + Testcontainers/Postgres efêmero (integração).
- **Lint/format**: ESLint 9 (flat config) + Prettier, com separação estrita de papéis — Prettier formata, ESLint lint. `eslint-config-prettier` desliga regras de estilo do ESLint (NÃO usar `eslint-plugin-prettier`). Import sort via `eslint-plugin-simple-import-sort` (auto-fix). **fix-on-save** ligado via `.vscode/settings.json` versionado no repo.

## Versionamento do app
- **Versão exibida ao fiel** mora numa constante manual em `packages/pwa/src/version.ts` (`APP_VERSION`) — não no `package.json`.
- **SemVer** `MAJOR.MINOR.PATCH`, bump **manual** a cada release: **MINOR** a cada milestone/feature visível ao fiel, **PATCH** em correções, **MAJOR** só em reescrita grande.

## Topologia (INEGOCIÁVEL)
- **Um backend, um banco.** Dois frontends (pwa-fiel, web-admin). NÃO criar segundo backend.
- Monólito modular. Módulos conversam por interfaces, não pelos internos uns dos outros.
- Schemas Zod + tipos de domínio vivem no pacote compartilhado. Fonte única de verdade; tipos por `z.infer`.

## Estrutura de pastas (alvo)
```
packages/
  shared/     # schemas Zod, tipos de domínio, regras puras compartilháveis
  api/        # backend Fastify (delivery → application → domain; infra implementa portas)
  pwa/        # PWA do fiel (React + Vite + Workbox)
  admin/      # painel web desktop (React + Vite)
docs/
  design.md   # documento de design (o porquê)
  tasks.md    # plano de execução fatiado
```

## Arquitetura DDD-lite (no pacote api)
- **domain**: entidades, regras puras. Sem imports de framework/DB.
- **application**: use-cases, um por operação. Unidade natural de teste.
- **infrastructure**: repositórios Prisma, clients externos, adapters. Implementam portas das camadas internas.
- **delivery**: rotas Fastify, validação (Zod), serialização. Fino.
- Dependências apontam para dentro.

## Regras de domínio que NÃO podem ser violadas
- **Autoridade do streak é do SERVIDOR.** O cliente nunca decide se o dia foi cumprido. O device registra conclusão com timestamp + dia lógico numa fila offline; o servidor valida contra o `timezone` do usuário ao sincronizar.
- **Idempotência**: conclusão de dia e anotações usam `idempotencyKey`. Reenvio nunca duplica contagem.
- **Passagem bíblica é REFERÊNCIA canônica, nunca texto copiado.** Guardar `translationId + bookReferenceId + chapter + verseStart + verseEnd`. O texto é montado da tabela `verse` na exibição.
- **Conquistas (insígnia/prêmio) são permanentes.** Streak zera → árvore volta à semente, mas `Achievement` nunca é apagado.
- Notificações são **best-effort** e multi-canal (push + WhatsApp), disparadas pelo servidor. WhatsApp atrás de interface `NotificationChannel` (adapter trocável).

## Fluxo de trabalho (TDD — INEGOCIÁVEL)
- **Teste primeiro.** Toda regra de domínio/use-case começa pelo teste (red → green → refactor).
- Unit no domínio/use-cases: funções puras, SEM I/O.
- Integração contra **Postgres real** (Testcontainers). NUNCA mockar a camada de dados.
- Borda HTTP: poucos testes de contrato (valida com Zod, chama use-case, serializa). Não retestar regra de negócio aqui.
- Trabalhe em tarefas pequenas de `@docs/tasks.md`. Conclua uma (com testes passando) antes da próxima.

## Comandos
- `pnpm install` — instala tudo
- `pnpm test` — roda a suíte (precisa de Docker para integração)
- `pnpm --filter api ...`, `pnpm --filter pwa ...`, `pnpm --filter admin ...`

## Não fazer
- Não criar segundo backend nem segundo banco.
- Não copiar o texto da passagem para dentro do devocional (usar referência).
- Não deixar o cliente decidir o streak.
- Não mockar Postgres nos testes de integração.
- Não misturar PT-BR em identificadores/schema; não misturar inglês em conteúdo de usuário.
- Não gerar comentários excessivos.
- Não pular a escrita do teste antes da implementação de regra de domínio.

## Design visual
Direção "aconchegante/orgânica" — ver `@docs/design-guide.md` antes de construir qualquer UI.
