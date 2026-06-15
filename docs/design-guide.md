# Guia de design visual

Direção: **aconchegante e orgânica** — o oposto de um app corporativo. A metáfora condutora é a **árvore que cresce**: tons naturais/terrosos, formas suaves, sensação de calma e de algo vivo que se cultiva ao longo do tempo. O app é um espaço de quietude diária, não um feed.

> Esta é uma direção, não um pixel-perfect. Use a skill `frontend-design` para executar com qualidade. Os dois frontends compartilham a linguagem visual, mas adaptam a densidade: PWA do fiel é **mobile-first e respirado**; admin é **desktop e mais denso** (formulários, tabelas).

## Princípios
- **Calma acima de tudo.** Bastante respiro (whitespace), nada de poluição. A tela do fiel deve dar vontade de desacelerar.
- **Crescimento como tema.** A árvore é o elemento-assinatura; deixe-a ser o momento memorável. Tudo ao redor fica quieto e disciplinado.
- **Conteúdo é o herói.** O versículo/devocional ocupa o centro; a interface some.
- **Movimento sutil e com propósito.** A árvore cresce com transições suaves; a oração tem ambiência calma. Evitar animação dispersa e gratuita (parece gerado por IA).
- **Acessível por padrão.** Responsivo até mobile, foco de teclado visível, `prefers-reduced-motion` respeitado.

## Paleta (ponto de partida — refine ao construir)
Tons orgânicos e quentes; verde de folha como cor viva, terroso como base.
- `--bg`: creme/papel quente, não branco puro (ex. `#F7F4EC`)
- `--surface`: levemente mais clara/escura que o bg para cards
- `--ink`: marrom-escuro suave em vez de preto puro (ex. `#2E2A24`)
- `--leaf`: verde de folha vivo, a cor de "crescimento" (ex. `#4F7A4A`)
- `--bark`: marrom de tronco/raiz para acentos terrosos (ex. `#8A6B4F`)
- `--bloom`: um acento quente para conquistas/floração (ex. âmbar/coral suave)

## Tipografia
- **Display**: uma fonte com personalidade calorosa (humanista/serifada suave) para versículos e títulos — usada com restrição.
- **Body**: uma sans humanista legível e acolhedora para corpo de texto e UI.
- **Evitar** o par "serifa de alto contraste + terracota sobre creme", que é o default genérico de IA. Buscar algo mais orgânico e próprio.
- Escala de tipo clara; o versículo do dia merece tratamento generoso.

## A árvore (elemento-assinatura)
- Reflete `StreakState`: semente → broto → muda → galhos → tronco+raízes → árvore frondosa → floração/frutos.
- Crescimento com transição suave entre estágios; sensação de algo vivo, não um gráfico.
- Ao quebrar o streak, a regressão à semente deve ser visível mas gentil — sem punir visualmente de forma agressiva (o streak já zera; a árvore não precisa humilhar).
- Insígnias/prêmios entram numa coleção que parece um "jardim"/herbário pessoal.

## Copy (PT-BR)
- Voz da interface: calorosa, simples, em sentença (sem caixa-alta de marketing).
- Verbos ativos: o botão diz o que faz ("Ler", "Escutar", "Concluir"), e o nome se mantém pelo fluxo.
- Erros não pedem desculpa nem são vagos: dizem o que houve e como resolver.
- Tela/estado vazio é convite à ação, não enfeite.
- Nada de termos de sistema na cara do usuário (a pessoa gerencia "lembretes", não "push subscriptions").

## Admin (desktop)
- Mesma paleta/tipografia, porém mais funcional e densa: formulários claros, preview do conteúdo, seletor bíblico fluido.
- Prioridade é eficiência de autoria (Vitor sobe conteúdo todo dia) sobre beleza — mas sem feiura.
