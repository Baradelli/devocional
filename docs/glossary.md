# Glossário

Termos de domínio do projeto. Código/identificadores em **inglês** (CLAUDE.md); este glossário liga o termo de negócio (PT) ao identificador canônico (EN) e à regra.

## Identidade & convites

| Termo (negócio) | Identificador (código) | Significado / regra |
|---|---|---|
| Convite | `Invite` | Autorização de cadastro. Cadastro é **fechado por convite** (premissa do produto). Tem `code`, `email?`, `status`, `expiresAt`, `createdById`, `usedById?`, `usedAt?`. |
| Código do convite | `Invite.code` | String compartilhável gerada pela API. Vai dentro do `registerUrl`. |
| Link de cadastro | `registerUrl` | `${APP_URL}/register?code=…` montado **pela API** e devolvido no payload do convite (ADR-010). O admin copia e envia (ex.: WhatsApp). |
| Convite pendente | `status = PENDING` | Ainda não usado e não revogado. Pode estar **expirado** (ver abaixo) mesmo permanecendo `PENDING` no banco. |
| Convite usado | `status = USED` | Já consumido por um cadastro. **Intocável**. Expõe `usedBy` (nome+email de quem resgatou) na UI do admin. |
| Convite revogado | `status = REVOKED` | Cancelado pelo admin. Só `PENDING` pode ser revogado (ADR-010). Mantido para auditoria (não é deletado). |
| Convite expirado | derivado de `expiresAt` | `evaluateInvite` retorna `EXPIRED` quando `expiresAt <= now`. É **calculado**, não um `status` armazenado — um `PENDING` vencido aparece como expirado na UI. Default de expiração: **1 dia**. |
| Convite que trava o e-mail | `Invite.email != null` | Quando o admin preenche o e-mail, o cadastro **só** aceita esse e-mail (ADR-010). E-mail nulo = convite aberto. |
| Cadastro com convite | `registerWithInvite` | Valida o convite (puro), cria `User` (`role = MEMBER`), consome o convite (`markUsed`) e abre sessão — tudo numa transação. Fuso capturado do browser no cadastro. |

## Usuários & engajamento (tela admin de pessoas)

| Termo (negócio) | Identificador / origem | Significado / regra |
|---|---|---|
| Roster | tela admin de usuários | Tabela **read-only** de quem está cadastrado + **sinais leves** de hábito (ADR-009). Não age sobre o usuário. |
| Sinais leves | — | Por pessoa: streak atual, último dia concluído, concluiu hoje?, total de conclusões. **Sem** histórico devocional-a-devocional. |
| Concluiu hoje? | derivado de `DailyCompletion` + `logicalDate` | "Hoje" no **fuso do usuário** (autoridade do servidor, ADR-001), não no fuso do admin. |
| Nominal vs agregado | ADR-009 | Dashboard de **engajamento** (Grupo B) segue 100% **agregado**. A tela de **pessoas** é nominal mas limitada a sinais leves. São coisas distintas. |

## Jardim & árvore (animação)

| Termo (negócio) | Identificador (código) | Significado / regra |
|---|---|---|
| Estágio da árvore | `treeStage` | Enum discreto do servidor (`SEED`…`FRUITING`) derivado do streak. Usado **só para o texto** (rótulo + dica) na nova árvore animada (ADR-012). |
| Crescimento | `growth` / `g` | Valor **contínuo** (0→6) que desenha a árvore, calculado de `currentStreak` via `growthFor()`. Fonte da animação de abertura e do "+1" (ADR-012). É derivado no cliente, não persistido. |
| Animação de abertura | — | Ao entrar no Jardim, a árvore cresce de `g=0` até o `growthFor(currentStreak)`. Respeita `prefers-reduced-motion` (vai direto ao estado final). |
| Modal de conclusão | — | Abre **só numa conclusão nova** do dia (ação `finish`). A árvore **brota do zero** até o estado de ontem (lead-in) e dá o **passo de hoje** até o novo estado, com celebração; fecha por botão "Continuar" (sem auto-fechar); mantém o fiel em `/today`. |
| Otimismo de exibição | — | Offline, o modal cresce de forma otimista (`anterior+1`) e reconcilia no sync. É só **exibição** — a autoridade do streak segue no servidor (ADR-001/ADR-012). |
| Marco no modal | `snapshot.newAchievements` | Insígnia semanal / prêmio mensal só celebram no modal quando o **servidor** os concede; nunca adivinhados pelo cliente. Offline, só o crescimento simples aparece. |
