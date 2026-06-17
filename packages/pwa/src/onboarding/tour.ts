export interface TourStep {
  title: string;
  body: string;
}

/**
 * Conteúdo versionado do tour inicial (PT-BR). Cobre o que o fiel precisa saber
 * no primeiro acesso (design §onboarding). Bump em TOUR_VERSION se um dia
 * quisermos reexibir após mudanças relevantes.
 */
export const TOUR_VERSION = 1;

export const TOUR_STEPS: TourStep[] = [
  {
    title: 'Bem-vindo 🌱',
    body: 'Este é seu espaço de quietude diária. Um devocional por dia, sem pressa e sem ruído.',
  },
  {
    title: 'O devocional de hoje',
    body: 'A tela "Hoje" traz o conteúdo do dia em blocos: uma frase, a passagem bíblica, a reflexão, a oração e perguntas para o seu dia.',
  },
  {
    title: 'Ler ou escutar',
    body: 'Cada bloco pode ser lido ou ouvido. Ao escutar, o texto acompanha o áudio — escolha o que combina com o seu momento.',
  },
  {
    title: 'Um tempo de oração',
    body: 'O bloco de oração traz uma ambiência tranquila, com imagem e som suave, para você desacelerar e orar.',
  },
  {
    title: 'Suas anotações',
    body: 'Escreva o que tocou seu coração. Suas anotações ficam guardadas na biblioteca pessoal, organizadas por data — e só você as vê.',
  },
  {
    title: 'A árvore que cresce',
    body: 'A cada dia concluído, sua árvore cresce e sua sequência avança. Se faltar um dia, ela volta à semente — sem cobrança, é só recomeçar. Insígnias e prêmios ficam para sempre no seu jardim.',
  },
  {
    title: 'Lembretes no seu horário',
    body: 'Em "Lembretes" você escolhe a hora e os canais: notificação no aparelho e/ou WhatsApp. O lembrete chega no seu fuso, todo dia.',
  },
  {
    title: 'Instale no iPhone',
    body: 'No iPhone, toque em Compartilhar e em "Adicionar à Tela de Início". Abrir o app por lá é o que permite receber as notificações.',
  },
  {
    title: 'Valide seu WhatsApp',
    body: 'Para receber lembretes por WhatsApp, cadastre seu número em "Lembretes" e confirme o código que enviamos. Só números validados recebem mensagem.',
  },
];
