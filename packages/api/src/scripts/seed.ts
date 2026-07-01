import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import type { CreateDevotionalRequest } from '@devocional/shared';

import { logicalDate } from '../domain/gamification/logicalDate.js';
import { treeStage } from '../domain/gamification/tree.js';
import { createBibleModule } from '../infrastructure/bible/bibleModule.js';
import { loadEnv } from '../infrastructure/config/env.js';
import { createContentModule } from '../infrastructure/content/contentModule.js';
import { createIdentityModule } from '../infrastructure/identity/identityModule.js';
import { createPrismaClient } from '../infrastructure/prisma/client.js';

/**
 * Seed de desenvolvimento (idempotente): popula um banco local para testar a
 * API e os dois frontends ponta a ponta. NÃO use em produção.
 *
 *   pnpm --filter @devocional/api seed
 *
 * Cria: tradução demo (Salmos/João), admin, membro com streak, devocional
 * publicado de HOJE (no fuso do servidor) e um convite PENDING para testar o
 * cadastro. Reexecutar não duplica nada.
 */

const SERVER_TZ = 'America/Sao_Paulo';
// Credenciais só de desenvolvimento. Sobrescreva por env se quiser; o guard em
// main() impede este seed de rodar contra produção.
const ADMIN = {
  name: process.env.SEED_ADMIN_NAME ?? 'Vitor',
  email: process.env.SEED_ADMIN_EMAIL ?? 'vitor@dev.local',
  password: process.env.SEED_ADMIN_PASSWORD ?? 'dev-admin-password',
};
const MEMBER = {
  name: process.env.SEED_MEMBER_NAME ?? 'Maria',
  email: process.env.SEED_MEMBER_EMAIL ?? 'maria@dev.local',
  password: process.env.SEED_MEMBER_PASSWORD ?? 'dev-member-password',
};

const sampleTranslation = fileURLToPath(
  new URL('../../prisma/seed-data/sample-translation.json', import.meta.url),
);

async function main(): Promise<void> {
  const env = loadEnv();
  // Trava de segurança: este seed cria dados de demonstração e NUNCA deve tocar
  // produção (ver incidente: rodou em prod e criou admin com senha do repo).
  if (env.NODE_ENV === 'production') {
    throw new Error('Seed é apenas para desenvolvimento — recusando NODE_ENV=production.');
  }
  const prisma = createPrismaClient(env.DATABASE_URL);
  const identity = createIdentityModule(prisma);
  const bible = createBibleModule(prisma);
  const content = createContentModule(prisma, bible, {
    mediaDir: env.MEDIA_DIR,
    serverTimezone: SERVER_TZ,
  });

  await prisma.$connect();
  try {
    // 1) Bíblia demo (importação já é idempotente).
    const importResult = await bible.importTranslation(
      JSON.parse(readFileSync(sampleTranslation, 'utf8')) as Parameters<
        typeof bible.importTranslation
      >[0],
    );
    const translation = (await bible.listTranslations()).find((t) => t.code === 'DEMO');
    if (!translation) {
      throw new Error('Tradução DEMO não encontrada após a importação.');
    }
    log(`Bíblia DEMO: ${String(importResult.bookCount)} livros.`);

    // 2) Admin (autor único).
    const admin =
      (await prisma.user.findUnique({ where: { email: ADMIN.email } })) ??
      (await identity.createAdminUser({ ...ADMIN, timezone: SERVER_TZ }));
    log(`Admin: ${admin.email}`);

    // 3) Membro, criado pelo fluxo real de convite.
    let member = await prisma.user.findUnique({ where: { email: MEMBER.email } });
    if (!member) {
      const invite = await identity.createInvite({
        createdById: admin.id,
        email: MEMBER.email,
        expiresInDays: 14,
      });
      const result = await identity.registerWithInvite({
        inviteCode: invite.code,
        ...MEMBER,
        timezone: SERVER_TZ,
      });
      member = await prisma.user.findUnique({ where: { id: result.user.id } });
    }
    if (!member) {
      throw new Error('Falha ao criar o membro de demonstração.');
    }
    log(`Membro: ${member.email}`);

    // 4) Streak de exemplo para o jardim/árvore (M7) não nascer vazio.
    const today = logicalDate(new Date(), member.timezone);
    const streak = 5;

    // Conclusões dos últimos `streak` dias, para a semana e o calendário não
    // nascerem vazios. logicalDate de cada dia no fuso do membro.
    const days = Array.from({ length: streak }, (_, i) => {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - i);
      return logicalDate(d, member.timezone);
    });
    await prisma.dailyCompletion.createMany({
      data: days.map((logical) => ({
        userId: member.id,
        logicalDate: logical,
        idempotencyKey: `seed-${logical}`,
        completedAt: new Date(`${logical}T12:00:00Z`),
      })),
      skipDuplicates: true,
    });

    await prisma.streakState.upsert({
      where: { userId: member.id },
      create: {
        userId: member.id,
        currentStreak: streak,
        longestStreak: streak,
        lastCompletedLogicalDate: today,
        treeStage: treeStage(streak),
      },
      update: {},
    });

    // 5) Devocional de HOJE, publicado.
    if (!(await prisma.devotional.findUnique({ where: { date: today } }))) {
      await content.createDevotional(devotionalForToday(today, translation.id));
      await content.publishDue();
    }
    log(`Devocional publicado para ${today}.`);

    // 6) Convite PENDING extra para testar o cadastro na UI (reaproveita o
    // existente para não acumular convites a cada reseed).
    const spare =
      (await prisma.invite.findFirst({ where: { status: 'PENDING', email: null } })) ??
      (await identity.createInvite({ createdById: admin.id, email: null, expiresInDays: 14 }));
    log(`Convite de teste (PENDING): ${spare.code}`);

    process.stdout.write('\nSeed concluído. Credenciais:\n');
    process.stdout.write(`  admin  → ${ADMIN.email} / ${ADMIN.password}\n`);
    process.stdout.write(`  membro → ${MEMBER.email} / ${MEMBER.password}\n`);
  } finally {
    await prisma.$disconnect();
  }
}

function devotionalForToday(date: string, translationId: string): CreateDevotionalRequest {
  return {
    date,
    theme: 'confiança',
    quote: { text: 'Ainda que eu ande pelo vale da sombra da morte, não temerei mal algum.' },
    passage: {
      // Salmos 23:1-3 da tradução DEMO.
      reference: { translationId, bookReferenceId: 19, chapter: 23, verseStart: 1, verseEnd: 3 },
    },
    devotional: {
      text: 'O cuidado do Pastor não depende do terreno. Em pastos verdes ou no vale, é o mesmo Senhor que guia, refrigera e sustenta. Descanse hoje na certeza de que você é conhecido e conduzido.',
    },
    prayer: {
      text: 'Senhor, meu Pastor, aquieta o meu coração. Conduz-me às tuas águas tranquilas e refrigera a minha alma. Confio na tua direção. Amém.',
    },
    reflection: {
      questions: [
        'Em que área da sua vida você precisa confiar mais na direção de Deus?',
        'O que significa, para você hoje, descansar em "verdes pastos"?',
        'Onde você tem sentido o "vale", e como o Pastor tem caminhado com você ali?',
      ],
      actions: [
        'Reserve cinco minutos de silêncio para ouvir antes de falar.',
        'Anote uma situação que você entrega à direção de Deus hoje.',
        'Procure alguém que está no "vale" e ofereça uma palavra de cuidado.',
      ],
    },
  };
}

function log(message: string): void {
  process.stdout.write(`• ${message}\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`${String(error)}\n`);
  process.exit(1);
});
