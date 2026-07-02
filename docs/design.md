# Devocional (app estilo Glorify) — Documento de Design

**Status:** rascunho · **Autor:** Vitor · **Data:** 15/06/2026

---

## 1. Contexto e problema

App devocional de inspiração no **Glorify**, voltado a **incentivar a vida devocional e bíblica diária** de uma igreja / grupo (dezenas a ~centenas de pessoas no v1). O problema que resolve: manter as pessoas constantes no hábito de devocional, oferecendo um conteúdo diário curto, guiado e com um sistema de progresso que recompensa a consistência.

A premissa de UX, herdada do Glorify, é **simplicidade radical**: o app é basicamente uma tela "Hoje". Não há, no v1, navegação para o devocional de ontem nem biblioteca pública de conteúdo passado — a pessoa abre, faz o devocional do dia, e pronto. (A *exceção* é a biblioteca pessoal de **anotações**, que o usuário acessa para rever seus próprios dias — ver §3.)

**Tipo de projeto:** produto real para um grupo definido, mantido por **um único desenvolvedor/autor (Vitor)**, que também é o **único produtor de conteúdo** (sobe o devocional manualmente). É um MVP de produção pequeno, não um experimento descartável nem um produto de escala aberta.

**Restrições que delimitam o design:**
- **PWA** (não app nativo), para rodar em qualquer celular a partir de uma única base.
- **Mobile-first** e **offline-first** — o devocional precisa funcionar sem rede.
- **Notificações push** com horário configurável por usuário.
- **Cadastro fechado por convite** — só quem Vitor autoriza entra.
- Solo dev, orçamento de infra baixo, hospedagem auto-gerenciada (terreno conhecido do autor).

## 2. Objetivos e não-objetivos

**Objetivos (v1):**

1. Entregar o **devocional do dia** com a estrutura: versículo/frase inicial (simples) → passagem bíblica → devocional → oração → reflexão (3 perguntas + 3 ações práticas).
2. Cada bloco (exceto a frase/versículo inicial) tem **opção de ler e de escutar**; ao escutar, o texto acompanha enquanto o áudio toca.
3. **Oração** com ambiente imersivo: gif/animação de fundo + som tranquilo em loop.
4. **Anotações** por dia, com uma **biblioteca pessoal** das próprias anotações (rastreio dos próprios dias).
5. **Gamificação completa**: streak diário (zera ao perder um dia), **árvore que cresce** por estágios, **insígnia semanal**, **prêmio mensal**, com coleção permanente de conquistas.
6. **Painel de admin** (só Vitor) para subir o conteúdo diário (textos + áudios via upload + gif/som da oração); o conteúdo fica disponível às 00h da sua data.
7. **Base bíblica estruturada** (importada via SQL, suportando várias traduções), com um **seletor Livro → Capítulo → range de versículos** no admin para escolher a passagem; o devocional guarda a *referência canônica*, não o texto — isso prepara o terreno para as métricas da v2 sem exigir o dashboard agora.
8. **Notificação de lembrete** com horário configurável por cada usuário, em **canais à escolha do usuário**: Web Push, WhatsApp, ou ambos.
9. **WhatsApp como canal de notificação opcional**, com fluxo de **validação do número** antes de ativar.
10. **Onboarding inicial** no app, explicando os blocos, ler/escutar, oração, anotações, árvore/streak e como ativar os lembretes (incluindo instalar o PWA no iPhone e validar o WhatsApp).
11. Funcionar **offline** (devocional do dia + ações de progresso enfileiradas) e **sincronizar** ao reconectar.
12. **Login simples** com sincronização de streak e anotações entre dispositivos.

**Não-objetivos (v1) — deliberadamente fora:**
- **Comunidade** (ver notas de outros, compartilhar oração, feed). Elimina moderação, feed e privacidade de terceiros.
- **Dashboard analítico.** Adiado para a v2. A base de dados do v1 já guarda a passagem como referência canônica (ADR-006) e as conclusões, então as métricas serão calculáveis retroativamente quando o dashboard chegar — mas a tela em si não entra no v1.
- **Troca de tradução pelo leitor.** A base suporta várias traduções e *Vitor* escolhe qual usar em cada devocional, mas o leitor vê só a tradução escolhida — sem seletor de tradução na tela do fiel (evita alinhamento entre traduções e cache por tradução). O dado já fica pronto pra liberar isso depois.
- **Cursos / jornadas de vários dias.** Só o devocional diário.
- **Acesso a devocionais passados** (o de ontem etc.) na navegação. O banco guarda o histórico de conteúdo para liberar isso *no futuro*, mas a UI do v1 não expõe.
- **Geração automática de áudio (TTS).** Áudio é sempre upload manual.

## 3. Requisitos funcionais

Organizados pelos fluxos principais. Corte de v1 salvo indicação contrária.

**Fluxo A — Consumir o devocional do dia (fiel)**

| Capacidade | Ator | Critério de aceite |
|---|---|---|
| Ver a tela "Hoje" | Fiel logado | Ao abrir, vê o devocional do dia atual (no fuso do usuário); blocos na ordem: frase/versículo → passagem → devocional → oração → reflexão. |
| Ler um bloco | Fiel | Texto do bloco renderiza legível em mobile; passagem pode ser navegada em "cards" sequenciais (estilo stories). |
| Escutar um bloco | Fiel | Botão "escutar" toca o áudio enviado para aquele bloco; o texto correspondente aparece/destaca enquanto toca; play/pause funciona. *(Sincronização palavra-a-palavra é não-goal; basta o texto visível acompanhando o áudio.)* |
| Fazer a oração | Fiel | Tela de oração mostra gif/animação de fundo + som tranquilo em loop; texto da oração disponível para ler ou escutar. |
| Concluir o devocional | Fiel | Ao chegar ao fim, o dia é marcado como concluído; dispara avaliação de streak/árvore (ver Fluxo C). |
| Anotar sobre o dia | Fiel | Pode escrever/editar uma anotação atrelada ao devocional do dia; salva offline e sincroniza. |
| Ver biblioteca de anotações | Fiel | Lista as próprias anotações por data, abre cada uma. (Única "viagem ao passado" do v1.) |

**Fluxo B — Onboarding e configuração (fiel)**

| Capacidade | Ator | Critério de aceite |
|---|---|---|
| Entrar por convite | Fiel | Acessa via convite autorizado por Vitor; cria conta (login simples). Sem convite, não entra. |
| Configurar horário do lembrete | Fiel | Escolhe o horário da notificação diária; o push chega nesse horário (no fuso do usuário). |
| Instalar o PWA | Fiel | Recebe instrução para "adicionar à tela de início" (necessário para push no iOS). |
| Fazer o onboarding | Fiel | No primeiro acesso, vê um tour que explica blocos (ler/escutar), oração, anotações, árvore/streak e como ativar lembretes; marca `onboardingCompletedAt`. Pode rever depois. |
| Escolher canais de lembrete | Fiel | Ativa/desativa Web Push e/ou WhatsApp de forma independente; define o horário. |
| Validar número de WhatsApp | Fiel | Digita o número → recebe um código → confirma; só então o canal WhatsApp fica ativo. Número não validado não recebe mensagem. |

**Fluxo C — Gamificação (sistema)**

| Capacidade | Ator | Critério de aceite |
|---|---|---|
| Avaliar streak | Sistema | Ao concluir o dia, o **servidor** valida se foi dentro do dia lógico do usuário; incrementa o streak ou o quebra (zera) se um dia foi pulado. |
| Crescer a árvore | Sistema | O estágio visual da árvore reflete o streak atual (tabela de estágios em §6). |
| Murchar ao quebrar | Sistema | Streak zerado → árvore volta ao estágio inicial (semente). |
| Conceder insígnia semanal | Sistema | Ao completar 7 dias consecutivos, concede insígnia da semana → vai para a coleção permanente. |
| Conceder prêmio mensal | Sistema | Ao completar o marco mensal (ver §6), concede prêmio → coleção permanente. |
| Preservar conquistas | Sistema | Insígnias e prêmios já conquistados **nunca** são removidos ao quebrar o streak. |

**Fluxo D — Autoria de conteúdo (admin, só Vitor)**

| Capacidade | Ator | Critério de aceite |
|---|---|---|
| Criar o devocional de uma data | Admin | Formulário com os blocos (frase/versículo, passagem, devocional, oração, reflexão: 3 perguntas + 3 ações). |
| Subir áudios | Admin | Upload de arquivo de áudio por bloco (passagem, devocional, oração); associado ao bloco certo. |
| Subir mídia da oração | Admin | Upload do gif/animação e do som de fundo da oração. |
| Agendar publicação | Admin | Define a data; o conteúdo fica disponível às 00h daquela data. |
| Importar tradução da Bíblia | Admin | Sobe um SQL no formato `book`/`verse`; a base passa a ter aquela tradução disponível para seleção. |
| Selecionar passagem | Admin | Seletor encadeado: tradução → **Livro** (agrupado por testamento) → **Capítulo** (só os que existem) → **range de versículos** (verso inicial/final); mostra preview do texto montado da tabela `verse`. Salva a *referência*, não o texto. |

## 4. Requisitos não-funcionais

| Categoria | Alvo / decisão | Implicação no design |
|---|---|---|
| Performance / latência | Abertura da tela "Hoje" instantânea mesmo offline; áudio inicia em < 1s quando em cache. | Devocional do dia pré-cacheado pelo service worker; mídia cacheável. |
| Escala / carga | Centenas de usuários, 1 devocional/dia idêntico para todos, leitura-pesada. Pico = janela da manhã/noite. | Conteúdo é o mesmo para todos → **altamente cacheável** (CDN/cache HTTP). Carga trivial; qualquer VPS aguenta. Sem necessidade de escala horizontal no v1. |
| Disponibilidade | Downtime de algumas horas é tolerável; sem SLA formal. Offline-first reduz dependência de uptime. | Não precisa de HA/multi-instância. Mas o **job de notificações** não pode falhar silenciosamente. |
| Consistência / integridade | **Streak não pode ser burlável nem quebrar injustamente.** Anotações não podem ser perdidas. | **Servidor autoritativo** para dia lógico e streak (ADR-001). Anotações com escrita offline + sync idempotente. |
| Segurança | Cadastro fechado por convite; cada usuário só vê/edita os próprios dados; admin só Vitor. | Auth por convite; autorização por papel (fiel/admin); rotas de admin protegidas. |
| Privacidade / LGPD | PII mínima (e-mail/nome, anotações pessoais — possivelmente sensíveis por serem religiosas). Direito a exclusão de conta. | Coletar o mínimo; permitir apagar conta+dados; anotações privadas por padrão (não há comunidade). |
| Observabilidade | Saber quando o job de notificações falhou. | Logs estruturados + alerta nos jobs críticos (não bolted-on). |
| Manutenibilidade / testes | Solo dev, vida longa. **TDD desde o início** como abordagem de desenvolvimento. | Boring tech, monólito modular, **testes unitários (domínio/use-cases, sem I/O) + integração contra Postgres real**; cobertura forte na lógica de streak/dia lógico/idempotência. Ver §12. |
| Custo | Infra baixa e de custo fixo. | VPS Ubuntu único + PM2; storage em disco no v1. |
| Deploy / operação | Auto-gerenciado, terreno conhecido do autor. | PM2 no Ubuntu; deploy simples; rollback por versão. |

## 5. Arquitetura

**Estilo: monólito modular** em TypeScript, com worker de jobs. Justificativa direta dos NFRs: escala trivial, solo dev, domínio pequeno e coeso → distribuir só adicionaria custo operacional sem nenhum ganho exigido por requisito. As fronteiras entre módulos ficam limpas para permitir extração futura barata, mas nada é distribuído no v1.

**Módulos (bounded contexts) e responsabilidades:**

- **Identidade & Convites** — login simples, convites, papéis (fiel/admin).
- **Conteúdo** — devocionais por data, blocos, mídias (áudio/gif/som); cada devocional fica disponível às 00h da sua data (por comparação de data, sem job de publicação). É o contexto que o admin alimenta. A passagem bíblica de um bloco é uma **referência** à Bíblia, não texto solto.
- **Bíblia** — base estruturada (book/verse) multi-tradução, importada via SQL; expõe o seletor (livro/capítulo/range) e a montagem de texto de uma referência. Leitura pesada e imutável após importação → fortemente cacheável.
- **Analytics (admin, somente-leitura) — v2.** Agregará referências bíblicas + conclusões para o dashboard (cobertura, repetições, rankings, uso). Fora do v1; sem pipeline próprio, lerá dos outros contextos. O v1 só garante que os dados existam no formato certo.
- **Progresso & Gamificação** — conclusão diária, streak, árvore, insígnias, prêmios. **Dono da regra de dia lógico e da autoridade do streak.**
- **Anotações** — CRUD de anotações pessoais por dia + biblioteca pessoal.
- **Notificações** — registro de subscriptions Web Push e de números de WhatsApp (com verificação), preferência de horário e de **canais** por usuário, agendamento e disparo multi-canal. O envio de cada canal fica atrás de uma interface (`NotificationChannel`) — Web Push e WhatsApp são adapters intercambiáveis.
- **Onboarding** — conteúdo estático versionado do tour inicial + flag de conclusão por usuário.

**Comunicação:** chamadas in-process entre módulos via interfaces (delivery → application → domain; infra implementa as portas). Nada de broker entre módulos no v1.

**Trabalho assíncrono / agendado (in-process no v1):**
- **Job "lembretes":** a cada poucos minutos, dispara os pushes cujos horários (no fuso de cada usuário) chegaram. (A disponibilidade do conteúdo não precisa de job: é decidida por comparação de data na leitura.)

Começa como jobs in-process no mesmo processo Node (ou um processo PM2 dedicado). Vira fila com infra (Redis) só se volume/durabilidade exigirem — não exigem no v1.

**Concerns transversais (decididos uma vez):**
- **Convenção de idioma:** **código em inglês, conteúdo em português.** Inglês para todo identificador (variáveis, funções, tipos, arquivos/pastas), schema do banco inteiro (tabelas, colunas, enums, constraints, migrations), rotas e campos de payload JSON, chaves dos schemas Zod, commits e comentários. Português para tudo que o usuário final lê/ouve: conteúdo devocional, textos de UI, mensagens de notificação (push/WhatsApp), copy do onboarding. **Erros de validação:** o schema Zod compartilhado define a regra; a mensagem exibida ao fiel é mapeada para português na camada de apresentação (front), evitando espalhar strings PT-BR dentro do schema compartilhado de forma inconsistente.
- **Auth/z:** sessão/token simples; middleware de papel protege as rotas `/admin` (só Vitor); todo dado de usuário filtrado por dono. O admin é um **frontend desktop separado** (sem PWA/offline) sobre o mesmo backend — ver ADR-008.
- **Validação:** **Zod em toda validação**, ponta a ponta. Um único schema Zod por entidade vive no pacote compartilhado do monorepo: o Fastify valida a entrada da API com ele (schema-first) e o front reusa o mesmo schema. Os tipos TS saem por `z.infer` — fonte única de verdade, sem divergência cliente/servidor.
- **Formulários:** **React Hook Form em todo formulário**, com `@hookform/resolvers/zod` ligando o schema Zod compartilhado ao form. Sem validação manual ad-hoc nem estado de form solto.
- **Erro:** tratamento centralizado; jobs críticos com retry + log + alerta.
- **Sync offline:** ações de progresso e anotações vão para uma **fila local** no cliente; ao reconectar, são enviadas com **chave de idempotência** para o servidor reconciliar sem duplicar.
- **Observabilidade:** logs estruturados; alerta nos dois jobs críticos.

**Esboço textual do fluxo offline-first:**

```
[PWA / Service Worker]
  - cacheia: app shell + devocional do dia + mídias
  - registra: conclusão do dia, anotações (fila local com id de idempotência)
        |  (ao reconectar)
        v
[API Fastify] --> valida dia lógico (fuso do usuário) --> [Progresso & Gamificação]
        |                                                        |
        +--> [Anotações]                                         +--> streak/árvore/insígnia/prêmio
        |
[Worker de jobs] --periódico--> dispara Web Push por horário
```

## 6. Modelo de dados (esboço)

Entidades centrais (Postgres). Foco nas partes que importam, não no schema completo.

- **User** — id, nome, email, papel (`fiel`|`admin`), **timezone** (essencial para o dia lógico), **onboardingCompletedAt?**, createdAt.
- **Invite** — id, código, criadoPor (admin), usadoPor (User?), expiraEm, status.
- **PushSubscription** — id, userId, endpoint + chaves (Web Push), device/label, criadoEm. (1 user : N devices.)
- **WhatsappContact** — id, userId, número (E.164), **status** (`pendente`|`verificado`), códigoVerificação?, expiraEm, verificadoEm?. Número só recebe mensagem se `verificado`.
- **ReminderPreference** — userId, horárioLocal (ex.: 07:00), **canais ativos** (push: bool, whatsapp: bool). Disparo calculado no fuso do user; cada canal ativável de forma independente.
- **Devotional** — id, **date** (única; a data de publicação), tema (opcional). Fica disponível às 00h da `date` (decidido por comparação de data na leitura). Histórico todo fica guardado (mesmo que a UI do v1 só mostre o de hoje).
- **DevotionalBlock** — id, devotionalId, tipo (`frase`|`passagem`|`devocional`|`oracao`|`reflexao`), ordem, texto?, **audioMediaId?**. Para `passagem`, o conteúdo é uma ou mais **PassageReference** (v1: uma) em vez de texto solto. Para `reflexao`, carrega as **3 perguntas + 3 ações**.
- **Translation** — id, código (ex.: `ARA`, `NVI`), nome. Cada SQL importado popula uma tradução.
- **Book** — id, translationId, book_reference_id (ordem canônica), testament_reference_id, name. (Espelha a tabela importada; chave canônica `book_reference_id` permite cruzar livros entre traduções.)
- **Verse** — id, bookId, chapter, verse, text. (Tabela importada; leitura pesada, imutável.)
- **PassageReference** — id, blockId, translationId, **book_reference_id**, chapter, verseStart, verseEnd. Guarda a *referência canônica* (não o texto) → o dashboard cruza por `book_reference_id`/chapter/verse independentemente de tradução, e o texto é montado da `Verse` na hora de exibir.
- **Media** — id, tipo (`audio`|`gif`|`som`), path/url, mimetype, tamanho. Usada por blocos (áudio) e pela oração (gif + som).
- **DailyCompletion** — id, userId, devotionalId, **logicalDate** (dia lógico no fuso do user), completedAt, **idempotencyKey** (único por user+logicalDate). É o registro que alimenta a gamificação e impede dupla contagem.
- **StreakState** — userId, currentStreak, longestStreak, lastCompletedLogicalDate, treeStage (derivável, mas materializado p/ leitura rápida).
- **Achievement** — id, userId, tipo (`insignia_semanal`|`premio_mensal`), referência (qual semana/mês), concedidoEm. **Coleção permanente — nunca apagada ao quebrar streak.**
- **Note** — id, userId, devotionalId, texto, updatedAt, **idempotencyKey**, deletedAt? (soft delete). Privada ao dono.

**Variáveis da árvore (o que você pediu) — proposta de regras concretas:**

A árvore tem `treeStage` derivado do `currentStreak`:

| Streak (dias) | Estágio | Marco |
|---|---|---|
| 0 | Semente (murcha/recém-plantada) | — |
| 1 | Broto | — |
| 2–3 | Muda com primeiras folhas | — |
| 4–6 | Galhos | — |
| 7–13 | Tronco firme + **raízes visíveis** | **Insígnia semanal** (a cada 7 dias: 7, 14, 21…) |
| 14–29 | Árvore jovem frondosa | — |
| 30+ | Árvore adulta que **floresce/dá frutos** | **Prêmio mensal** (a cada 30 dias) |

Regras: streak **zera** ao pular um dia → `treeStage` volta a Semente, mas **Achievements permanecem**. Insígnia semanal concedida a cada 7 dias *consecutivos*; prêmio mensal a cada 30 dias *consecutivos*. (Variáveis ajustáveis: limiares de estágio, intervalo de insígnia, intervalo de prêmio — todos parametrizáveis em config.)

## 7. Stack e justificativas

| Componente | Escolha | Razão / desvio |
|---|---|---|
| Linguagem / runtime | TypeScript (strict) + **Node.js 24 LTS** | TS por type-safety em código solo de vida longa. Node 24 é o Active LTS atual (suporte até abr/2028), maduro para produção — evita rodar o 26 (ainda Current até out/2026). Migrar ao 26 quando virar LTS traz a **Temporal API** nativa, útil para o cálculo de dia lógico/fuso. |
| Backend | Fastify | Default; schema-first leve, ideal para o punhado de endpoints aqui. Sem desvio. |
| Dados / ORM | Prisma (+ SQL cru onde brigar) | Default; migrations e tipagem fortes. Sem desvio. |
| Banco | PostgreSQL | Default; dados relacionais (user→completions→achievements) + base bíblica (book/verse) importada via SQL. Escala muito além do necessário. Sem desvio. |
| Frontend / PWA (fiel) | React + TypeScript + Vite + **Workbox** | App do fiel: mobile-first, offline-first, PWA instalável. |
| Frontend admin (Vitor) | React + TypeScript + Vite (web desktop, **sem** PWA/offline) | Frontend separado, desktop-only, online; denso em formulários e uploads. Mesmo backend, rotas `/admin`. |
| Validação / forms | **Zod** (schemas compartilhados) + **React Hook Form** (`@hookform/resolvers/zod`) | Padrão obrigatório: toda validação em Zod, todo form em RHF; schema único por entidade no monorepo, tipos por `z.infer`. |
| Testes | **Vitest** (unit) + integração com **Testcontainers / Postgres efêmero** | TDD desde o início; unit no domínio/use-cases, integração contra Postgres real. Ver §12 e ADR-007. |
| Async / jobs | In-process (scheduler/cron + fila simples) | Conforme stack-defaults: começa in-process; Redis-backed só se volume exigir — não exige no v1. |
| Hospedagem | VPS Ubuntu + PM2 | Default; terreno conhecido, custo fixo baixo, suficiente para centenas de usuários. |
| Push | **Web Push API (VAPID)** | Padrão aberto do PWA; servidor agenda e dispara. (iOS exige PWA instalado, ≥16.4.) |
| WhatsApp | Biblioteca não-oficial (Baileys/whatsapp-web.js), atrás de interface | Decisão do autor (ADR-005); chip dedicado + sessão persistida; trocável por Cloud API depois. |
| Storage de mídia | Disco do VPS no v1, atrás de uma interface | Simples e barato; trocável por S3-compatível depois sem mexer no domínio. |
| Repo | Monorepo leve (API + PWA-fiel + web-admin + pacote de tipos/schemas Zod) | Três frontends + **um backend**; domínio e schemas compartilhados, sem duplicação. |

## 8. Decisões e trade-offs (ADRs)

### ADR-001: Autoridade do "dia" e do streak no servidor
- **Contexto:** streak clássico que zera + app offline-first. Quem decide se "hoje" foi cumprido?
- **Opções:** **A)** cliente decide (otimiza offline puro; custa: burlável mudando o relógio + quebra injusta com fuso/horário errado). **B)** servidor valida no fuso do usuário ao sincronizar (otimiza integridade; custa: precisa reconciliar quando volta a rede).
- **Fator decisivo:** o requisito de integridade — "streak não pode ser burlável nem quebrar injustamente".
- **Decisão:** **B.** Cliente registra conclusão com timestamp + dia lógico numa fila offline; servidor confirma/quebra com base no `timezone` do User e numa `idempotencyKey` por dia.
- **Consequências:** o servidor é a fonte de verdade do progresso; o cliente mostra estado otimista e reconcilia. Mudaria se o app deixasse de ter streak punitivo (aí o cliente bastaria).

### ADR-002: Notificações multi-canal disparadas pelo servidor
- **Contexto:** lembrete em horário individual; PWA não tem timer confiável em background; usuário pode escolher Web Push, WhatsApp ou ambos.
- **Opções:** **A)** agendar no device (otimiza independência de rede; custa: Service Worker não dispara em horário confiável em background → não funciona). **B)** servidor agenda e dispara nos canais escolhidos, no horário de cada usuário (otimiza confiabilidade; custa: backend com job periódico + guardar subscriptions/contatos).
- **Fator decisivo:** confiabilidade do lembrete + limitação técnica real do PWA.
- **Decisão:** **B.** Job periódico no worker resolve, para cada usuário cujo horário chegou, os **canais ativos** e dispara via interface `NotificationChannel` (adapters: Web Push, WhatsApp).
- **Consequências:** exige backend sempre ligado + agendador. Cada canal é best-effort e independente: se um falha, os outros seguem. Atenção: **iOS só recebe Web Push se o PWA estiver instalado e ≥ iOS 16.4** — daí o WhatsApp como alternativa.

### ADR-005: WhatsApp via biblioteca não-oficial (risco aceito)
- **Contexto:** Vitor quer WhatsApp como canal de lembrete e aceitou o caminho não-oficial em vez da Cloud API oficial da Meta.
- **Opções:** **A)** Cloud API oficial (otimiza confiabilidade e conformidade; custa: número comercial verificado + templates aprovados + cobrança por conversa). **B)** Biblioteca não-oficial via WhatsApp Web, ex. Baileys/whatsapp-web.js (otimiza custo zero e liberdade de mensagem; custa: **risco de ban do número sem aviso**, fragilidade quando o protocolo muda, e operação extra — QR code, sessão persistida, processo vivo).
- **Fator decisivo:** decisão explícita do autor por custo zero, aceitando o risco.
- **Decisão:** **B**, com mitigações: chip **dedicado** (não o número pessoal), **espaçar os disparos** (não enviar tudo no mesmo instante), tratar o canal como **best-effort**, e **isolar o envio atrás da interface `NotificationChannel`** para que migrar à Cloud API oficial seja troca de adapter, não de arquitetura.
- **Consequências:** se o número for banido, os lembretes via WhatsApp param até subir outro número; o Web Push continua independente. **Porta de saída pronta:** trocar o adapter para Cloud API se o ban virar um problema recorrente.

### ADR-003: Monólito modular auto-hospedado
- **Contexto:** definir estilo e hospedagem para solo dev, escala de centenas.
- **Opções:** **A)** monólito modular + VPS/PM2 (otimiza simplicidade e custo fixo; custa: você opera o servidor). **B)** serverless/managed (otimiza scale-to-zero e menos ops; custa: cold starts ruins para o som/áudio contínuo, lock-in, e zero necessidade de escala aqui).
- **Fator decisivo:** escala trivial + custo baixo + conforto operacional do autor.
- **Decisão:** **A.** Sem debate — a escala não justifica distribuição nem serverless.
- **Consequências:** baixo custo e controle total; fronteiras de módulo limpas deixam extração futura barata. Mudaria se a base crescesse para dezenas de milhares com picos agudos.

### ADR-004: Conteúdo histórico guardado, UI não expõe (v1)
- **Contexto:** você quer a simplicidade do Glorify (só "hoje"), mas deixar caminho para liberar o passado depois.
- **Decisão:** modelar `Devotional` por data com histórico completo persistido; a UI do v1 só mostra o do dia. Liberar navegação ao passado é só trabalho de front no futuro.
- **Consequências:** zero retrabalho de dados para evoluir; nenhum custo de complexidade hoje.

### ADR-006: Passagem como referência canônica, não texto copiado
- **Contexto:** o devocional precisa de uma passagem bíblica; existe base estruturada multi-tradução; o dashboard precisa medir cobertura e repetição da Bíblia.
- **Opções:** **A)** copiar o texto da passagem para dentro do bloco (otimiza simplicidade de leitura/offline; custa: impossível agregar cobertura/repetição de forma confiável, e texto desatualiza se a tradução for corrigida). **B)** guardar só a **referência** (tradução + book_reference_id + capítulo + range) e montar o texto da `Verse` ao exibir (otimiza análise e integridade; custa: um join a mais na exibição, irrelevante na escala atual).
- **Fator decisivo:** o requisito do dashboard analítico — sem referência estruturada, "quanto da Bíblia já lemos" e "passagens mais repetidas" não são calculáveis.
- **Decisão:** **B.** A passagem é uma `PassageReference` canônica; o texto é derivado. O cache offline guarda o texto já montado do dia, então a leitura offline não sofre.
- **Consequências:** análise por livro/capítulo/versículo fica trivial; trocar tradução do leitor no futuro é só re-montar de outra `Translation`. A chave canônica `book_reference_id` permite cruzar entre traduções.

### ADR-007: TDD com Postgres real na integração (sem mock de dados)
- **Contexto:** o app nasce em TDD; a camada de dados precisa de uma estratégia de teste que não dê falsa confiança.
- **Opções:** **A)** integração contra **Postgres real** descartável, ex. Testcontainers (otimiza fidelidade — pega erro de SQL, migration e transação de verdade; custa: Docker no CI/ambiente de teste, suíte um pouco mais lenta). **B)** mock de repositório ou SQLite em memória (otimiza velocidade; custa: não pega divergência de dialeto nem bug de query — esconde a classe de bug que mais importa aqui).
- **Fator decisivo:** integridade do streak e as agregações dependem de SQL correto; mock esconderia justamente o que precisa ser garantido.
- **Decisão:** **A.** Unit puro no domínio/use-cases (sem I/O), integração contra Postgres real. Sem mock da camada de dados.
- **Consequências:** suíte confiável; exige Docker no CI. Mudaria só se o custo de operar Postgres no CI se tornasse proibitivo — improvável nesta escala.

### ADR-008: Admin como frontend separado, sobre o mesmo backend
- **Contexto:** o admin (só Vitor) é desktop-web, online, denso em formulários/uploads; o app do fiel é mobile-first/offline/PWA. São UXs opostas. Pergunta: separar só o frontend, ou virar uma aplicação (backend + deploy) à parte?
- **Opções:** **A)** dois frontends, **um backend** — admin é um app web desktop consumindo rotas `/admin` protegidas por papel (otimiza: zero duplicação de domínio, um schema, um deploy; os módulos Conteúdo/Bíblia que o admin escreve são os mesmos que o fiel lê. Custa: backend serve dois públicos, mitigado por autorização). **B)** dois frontends + **dois backends** (otimiza: isolamento físico do admin; custa: duplicar/compartilhar domínio, dois deploys, dois pontos de operação e — pior — ambos sobre o **mesmo banco** = monólito distribuído).
- **Fator decisivo:** solo dev, escala de centenas, e admin/fiel **compartilham o mesmo domínio de conteúdo**. Nenhum requisito de escala independente ou isolamento de falha justifica o custo de B.
- **Decisão:** **A.** Separar a **UI** (frontend admin desktop dedicado), manter **um backend** monolítico modular com rotas `/admin` por papel.
- **Consequências:** separação de UX sem imposto operacional de dois serviços. As fronteiras de módulo limpas deixam extrair o admin para serviço próprio barato *se* algum dia houver requisito real — que hoje não existe.

### ADR-009: Roster nominal com sinais leves (estreita o "nunca nominal" do M11)
- **Contexto:** o M11 fixou que **engajamento é sempre agregado, nunca nominal** (proteção de privacidade do fiel no dashboard). Surge a necessidade do admin de **acompanhamento pastoral**: ver quem está cadastrado e, de cada pessoa, se está mantendo o hábito.
- **Opções:** **A)** manter "nunca nominal" intacto — a tela de usuários é só roster (nome, email, papel, entrada, onboarding), sem nenhum sinal de conclusão por pessoa. **B)** roster **+ sinais leves** por pessoa (streak atual, último dia concluído, concluiu hoje?, total de conclusões), **sem** histórico devocional-a-devocional. **C)** nominal completo — drill-down de quais devocionais cada um concluiu, datas, etc.
- **Fator decisivo:** o admin é o **pastor/autor único** (não há terceiros vendo o dado) e o objetivo é cuidado pastoral, não vigilância. C exporia detalhe demais (quais textos, quando) sem ganho pastoral proporcional; A não atende ao pedido.
- **Decisão:** **B.** A tela de usuários é **read-only**: roster + sinais leves agregáveis por pessoa. **Nenhum** histórico por devocional, nenhuma anotação. A regra do M11 segue valendo para o **dashboard de engajamento** (Grupo B continua 100% agregado); o que muda é a existência de uma **tela de pessoas** com sinais de hábito. "Concluiu hoje?" e "último dia" são calculados no **fuso do usuário** (autoridade do servidor, ADR-001).
- **Consequências:** o dado coletado é o mesmo que já existe (conclusões/streak) — nenhuma coleta nova. Exclusão LGPD continua self-service no PWA (a tela admin não age sobre o usuário). Se um dia houver mais de um admin, esta decisão precisa ser revisitada (o pressuposto "admin = pastor único" deixa de valer).

### ADR-010: Ciclo de vida do convite — link, e-mail que trava, revogação
- **Contexto:** o backend já cria e lista convites e já modela `PENDING/USED/REVOKED` + `usedById`, mas **não há UI** para o admin gerar/gerenciar, **não há revogação**, e o código é compartilhado fora da app. Faltam decisões de produto para fechar o fluxo.
- **Opções/decisões:**
  - **Entrega:** a **API** monta `${APP_URL}/register?code=…` e devolve em `registerUrl` no payload do convite (fonte única da origem do PWA; o admin só copia). Alternativa rejeitada: admin concatena de uma env própria (duplicaria a config da origem em dois apps).
  - **E-mail:** opcional no convite; quando **preenchido, trava** o cadastro nesse e-mail (o link já vai para a pessoa certa); vazio = convite aberto a qualquer e-mail. Exige regra nova em `registerWithInvite` (erro de domínio quando o e-mail não bate) com teste primeiro.
  - **Expiração:** default **1 dia**, ajustável pelo admin (1–365, como o schema já permite) — janela curta por padrão reduz a janela de uso indevido de um link vazado.
  - **Cancelar = revogar:** só convites **`PENDING`** podem ser cancelados → marca `REVOKED` (reusa o que o domínio já avalia). `USED` é intocável (já virou conta), `EXPIRED` já é inerte. Mantém auditoria (não deleta a linha). Novo endpoint admin-only.
  - **Quem resgatou:** convites `USED` expõem **nome + e-mail** de quem se cadastrou (join `usedById → user`) — exige adicionar `usedBy` ao serializer público do convite.
- **Fator decisivo:** fechar o fluxo de cadastro fechado por convite (premissa do produto) com o menor toque no domínio existente, preferindo reusar estados/portas já modelados.
- **Consequências:** `inviteSchema` ganha `registerUrl` e `usedBy`; `InviteRepository` ganha `revoke`; `registerWithInvite` passa a validar e-mail travado. O fluxo passa a ser ergonômico (copiar link) sem depender de e-mail transacional (fora do v1).

### ADR-011: PWA ganha roteador para `/login` e `/register`
- **Contexto:** o `App.tsx` do PWA é um *state machine* (`useState<View>`) que, sem sessão, renderiza **só** `<Login>`. O link de convite (`/register?code=…`, ADR-010) precisa de uma rota pública alcançável **antes** do login.
- **Opções:** **A)** ler `?code=` da URL no boot e alternar `<Login>`/`<Register>` na mão, sem router. **B)** instalar **react-router** com `/login`, `/register` e o app autenticado no resto. **C)** só um toggle "tenho um convite" no Login (cola código manual).
- **Fator decisivo:** o convite é entregue como **URL**; uma rota pública de verdade é o caminho idiomático e evita lógica de URL ad-hoc espalhada no boot. O custo do router é pequeno e pago uma vez.
- **Decisão:** **B.** Instalar react-router no PWA: rotas públicas `/login` e `/register` (esta lê `?code=`), e o app autenticado sob o restante. O fuso é capturado no cadastro via `Intl.DateTimeFormat().resolvedOptions().timeZone`.
- **Consequências:** mudança estrutural pontual no shell do PWA (gate de auth passa a viver no router). O admin **não** muda (sem necessidade de rota pública lá). Workbox/offline seguem como estão; as rotas novas são parte do app shell já cacheado.

### ADR-012: Árvore animada por crescimento contínuo, não por estágio discreto
- **Contexto:** a árvore do Jardim era renderizada por `treeStage` discreto (7 SVGs com *crossfade* de 280ms). O novo visual (exemplo em `docs/arvore-exemplo`) é uma árvore orgânica desenhada a partir de um **valor de crescimento contínuo `g` (0→6)**, capaz de animar a entrada na tela ("cresce do zero até o estágio atual") e o ganho de um dia ("cresce +1"). Surge a dúvida: isso esbarra na autoridade do streak no servidor (ADR-001)?
- **Opções:** **A)** manter discreto — animar só entre os 7 SVGs de estágio (otimiza fidelidade total à autoridade discreta do `treeStage`; custa: perde o micro-crescimento diário e o "+1", que é justamente o que dá vida). **B)** renderizar `g = growthFor(currentStreak)`, interpolando o **número** que o servidor já fornece; usar `treeStage` só para o texto (rótulo/dica). No modal de conclusão, crescer até o `currentStreak` do `snapshot` do servidor quando online, e de forma **otimista (+1)** quando offline, reconciliando no sync.
- **Fator decisivo:** os limiares de estágio do exemplo (`[0,1,2,4,7,14,30]`) **coincidem** com a tabela de estágios do domínio (§6) — contínuo e discreto são a mesma verdade vista com resoluções diferentes. E a regra "o cliente nunca decide o streak" é sobre **autoridade/persistência**, não sobre **exibição**: o `design.md`/ADR-001 já prevê "estado otimista que reconcilia".
- **Decisão:** **B.** A árvore é uma **interpolação visual** de um número que o servidor possui (`currentStreak`). O otimismo offline (+1) é **só de exibição** e reconcilia no sync; se o servidor responder que nada mudou (reenvio idempotente), o modal **não** inventa "+1". Marcos (insígnia/prêmio) no modal são disparados pelo `snapshot.newAchievements` — nunca adivinhados pelo cliente; offline, só o crescimento simples aparece.
- **Consequências:** o renderer da árvore passa a depender de `currentStreak` (número), não de `treeStage`. Mantém ADR-001 intacto (autoridade segue no servidor). O modal de conclusão vira a vitrine do crescimento; o Jardim ganha a animação de abertura. Reverteria se a fidelidade discreta passasse a importar mais que a sensação de vida — improvável.

## 9. Escalabilidade e evolução

Dada a escala-alvo (centenas, conteúdo idêntico), **não há gargalo real no v1**. O que medir: taxa de entrega das notificações, falhas dos dois jobs críticos, tamanho/banda das mídias de áudio. Primeiro "gargalo" provável não é compute e sim **banda/armazenamento de áudio** se as gravações forem grandes — mitigável com compressão e cache HTTP/CDN, já que o arquivo é o mesmo para todos.

Caminho de evolução (quando/se crescer): **dashboard analítico (v2)** sobre os dados já coletados (cobertura da Bíblia, passagens mais repetidas, rankings, métricas de uso); **migrar para Node 26 LTS** quando este for promovido (out/2026), adotando a **Temporal API** nativa no cálculo de dia lógico/fuso (substituindo libs de data); mídia em disco → **S3-compatível + CDN** (interface já isolada); jobs in-process → **fila Redis-backed** se o volume de push exigir durabilidade/retry mais forte; liberar **devocionais passados** e depois os demais não-goals (comunidade, troca de tradução pelo leitor, cursos) como contextos novos.

**Adiar de propósito (não construir agora):** comunidade, troca de tradução pelo leitor, cursos multi-dia, TTS, fila com broker, CDN/S3, qualquer HA. Construir isso no v1 seria over-engineering puro frente à escala real. A base bíblica já suporta várias traduções, mas só do lado do autor.

## 10. Riscos e pontos em aberto

- **Push no iOS** depende do usuário instalar o PWA e de iOS ≥ 16.4. **Mitigado** com o canal WhatsApp como alternativa e onboarding explicando a instalação.
- **Ban do número de WhatsApp** (ADR-005): risco real e sem recurso. Mitigar com chip dedicado, disparos espaçados e tratamento best-effort; porta de saída = Cloud API oficial (troca de adapter).
- **Sessão do WhatsApp** (QR code + processo vivo + sessão persistida) é uma peça operacional que pode cair — precisa de monitoramento e de um jeito fácil de reconectar/reescanear.
- **Áudio + texto acompanhando**: definir o nível de sincronia. Proposto: texto do bloco visível acompanhando o áudio (sem sync palavra-a-palavra). **Confirmar se basta.**
- **Som de fundo da oração em loop** competindo com o áudio narrado da oração: definir se tocam juntos (mixados) ou se o som ambiente abaixa quando há narração. **Em aberto.**
- **Formato/limite das mídias** (tamanho de áudio, peso do gif) — definir limites para não estourar banda/cache.
- **Fuso do usuário**: capturar de forma confiável no cadastro e permitir ajuste (viagens).

## 11. Roadmap / próximos passos

Começar pelo fluxo de **maior risco**, que é a espinha offline + autoridade de streak — se isso não funcionar, o produto não se sustenta.

1. **Fundação:** monorepo, Fastify + Prisma + Postgres, modelo de dados, auth por convite, **setup de testes (Vitest + Testcontainers) e CI rodando a suíte desde o primeiro commit**.
2. **Fluxo de maior risco primeiro:** conclusão do dia offline → fila local → sync idempotente → servidor valida dia lógico e atualiza streak/árvore. Testar fuso, virada de dia e dupla submissão.
3. **Base bíblica:** importação dos SQLs (multi-tradução), modelo book/verse, e o **seletor livro→capítulo→range** com preview no admin.
4. **Conteúdo + admin:** painel para montar o devocional (passagem via referência) + subir áudios + mídia da oração; disponibilidade às 00h da data (por comparação de data).
5. **Tela "Hoje" (PWA):** blocos, ler/escutar com texto acompanhando, oração com gif + som; service worker cacheando o dia (texto da passagem já montado) para offline.
6. **Gamificação visual:** árvore por estágios, insígnia semanal, prêmio mensal, coleção permanente.
7. **Anotações + biblioteca pessoal.**
8. **Notificações:** subscriptions Web Push + cadastro/verificação de WhatsApp; preferência de horário e canais; adapter de WhatsApp (sessão + envio espaçado); job de disparo multi-canal.
9. **Onboarding:** tour inicial (blocos, ler/escutar, oração, anotações, árvore/streak, como ativar lembretes e instalar o PWA no iPhone), com flag de conclusão.
10. **Observabilidade:** logs + alertas nos jobs críticos e na sessão do WhatsApp; LGPD (exclusão de conta).

**v2 (planejado):** dashboard analítico do admin sobre os dados coletados no v1.

## 12. Estratégia de testes (TDD)

O app nasce em **TDD**: o ciclo red-green-refactor guia o desenvolvimento, começando pela lógica de maior risco. A pirâmide, amarrada à camada DDD-lite:

**Unitários — domínio e use-cases (sem I/O).** É onde o TDD mais rende e onde mora o risco do produto. Funções puras de estado → testam rápido, sem banco nem rede. Cobertura forte (escrita *antes* da implementação) para:
- Cálculo do **dia lógico** por fuso do usuário (limites 23:59 vs 00:01, viagem, fuso diferente).
- **Streak**: incremento, quebra ao pular dia, reset no limite.
- **Árvore**: estágio derivado do streak, murcha ao zerar.
- **Insígnia semanal / prêmio mensal**: concessão nos marcos, permanência ao quebrar streak.
- **Idempotência** do sync: mesma conclusão enviada duas vezes não dupla contagem.

**Integração — contra Postgres real (ADR-007).** Repositórios Prisma, migrations e queries de agregação contra um Postgres descartável (Testcontainers / banco efêmero). Sem mock da camada de dados.

**Borda HTTP — testes de contrato (poucos).** Que a rota Fastify valida com o schema **Zod** compartilhado, chama o use-case certo e serializa. Não reteste a regra de negócio aqui.

**Front (leve).** Schemas Zod já garantem a validação; testes de componente onde a interação tem lógica não-trivial (ex.: fila offline de ações). Sem perseguir cobertura de UI por cobertura.

Princípio: cada item do roadmap começa pelo teste. O passo 2 (offline + autoridade do streak) é o primeiro alvo do TDD justamente por ser o de maior risco.
