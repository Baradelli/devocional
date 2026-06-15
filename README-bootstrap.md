# Como começar com o Claude Code

Este pacote contém o que o Claude Code precisa para montar o app com qualidade e consistência. Não é o app — é o **terreno preparado**.

## Conteúdo
- `CLAUDE.md` — regras de execução, carregadas automaticamente em toda sessão do Claude Code. É o arquivo que o agente lê primeiro. Mantenha-o curto; o porquê fica no design doc.
- `docs/design.md` — o documento de design completo (o **porquê** de cada decisão).
- `docs/tasks.md` — o plano fatiado em tarefas pequenas e testáveis, em ordem.
- `docs/design-guide.md` — a direção visual (aconchegante/orgânica).
- `config-templates/` — configs prontas de ESLint (flat config), Prettier, e `.vscode/settings.json` com fix-on-save. Ver o README lá dentro; o agente coloca na raiz no M0.

## Passos
1. Crie um repositório git vazio e coloque estes arquivos na raiz (o `CLAUDE.md` na raiz; os `docs/` dentro de `docs/`).
2. Faça o primeiro commit.
3. Abra o Claude Code na pasta do repositório.
4. Dê o primeiro comando, algo como:
   > "Leia o CLAUDE.md, o docs/design.md e o docs/tasks.md. Comece pelo milestone M0 (fundação): monte o monorepo pnpm com os pacotes shared/api/pwa/admin, TypeScript strict, Fastify rodando com healthcheck, Prisma+Postgres conectados, e Vitest+Testcontainers com CI. Não avance para M1 antes do M0 estar com os testes passando."
5. Trabalhe milestone a milestone. Ao chegar no **M2**, exija TDD rigoroso — é a espinha de maior risco (dia lógico, streak, idempotência). Peça o teste antes da implementação.

## Lembretes
- Regras inegociáveis que *não podem ser "mais ou menos seguidas"* (ex. cobertura de teste, lint) devem ser impostas no **CI / pre-commit**, não só no CLAUDE.md — o agente trata o arquivo como contexto, não como configuração rígida.
- Decisões ainda em aberto (no design doc §10): sincronia áudio/texto e mix do som da oração. Decida quando chegar no M5.
- O WhatsApp usa biblioteca não-oficial por escolha consciente: trate como best-effort, chip dedicado, e saiba que pode tomar ban (porta de saída = Cloud API oficial, troca de adapter).
