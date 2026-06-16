-- CreateEnum
CREATE TYPE "BlockType" AS ENUM ('QUOTE', 'PASSAGE', 'DEVOTIONAL', 'PRAYER', 'REFLECTION');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('AUDIO', 'GIF', 'SOUND');

-- CreateTable
CREATE TABLE "Devotional" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "theme" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Devotional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DevotionalBlock" (
    "id" TEXT NOT NULL,
    "devotionalId" TEXT NOT NULL,
    "type" "BlockType" NOT NULL,
    "order" INTEGER NOT NULL,
    "text" TEXT,
    "audioMediaId" TEXT,
    "gifMediaId" TEXT,
    "soundMediaId" TEXT,
    "reflectionQuestions" TEXT[],
    "reflectionActions" TEXT[],

    CONSTRAINT "DevotionalBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PassageReference" (
    "id" TEXT NOT NULL,
    "blockId" TEXT NOT NULL,
    "translationId" TEXT NOT NULL,
    "bookReferenceId" INTEGER NOT NULL,
    "chapter" INTEGER NOT NULL,
    "verseStart" INTEGER NOT NULL,
    "verseEnd" INTEGER NOT NULL,

    CONSTRAINT "PassageReference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL,
    "type" "MediaType" NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimetype" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "originalName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Devotional_date_key" ON "Devotional"("date");

-- CreateIndex
CREATE INDEX "DevotionalBlock_devotionalId_idx" ON "DevotionalBlock"("devotionalId");

-- CreateIndex
CREATE UNIQUE INDEX "DevotionalBlock_devotionalId_order_key" ON "DevotionalBlock"("devotionalId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "PassageReference_blockId_key" ON "PassageReference"("blockId");

-- AddForeignKey
ALTER TABLE "DevotionalBlock" ADD CONSTRAINT "DevotionalBlock_devotionalId_fkey" FOREIGN KEY ("devotionalId") REFERENCES "Devotional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PassageReference" ADD CONSTRAINT "PassageReference_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "DevotionalBlock"("id") ON DELETE CASCADE ON UPDATE CASCADE;

