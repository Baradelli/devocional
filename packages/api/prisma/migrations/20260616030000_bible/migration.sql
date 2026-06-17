-- CreateTable
CREATE TABLE "Translation" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Translation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Book" (
    "id" TEXT NOT NULL,
    "translationId" TEXT NOT NULL,
    "bookReferenceId" INTEGER NOT NULL,
    "testamentReferenceId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Book_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Verse" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "chapter" INTEGER NOT NULL,
    "verse" INTEGER NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "Verse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Translation_code_key" ON "Translation"("code");

-- CreateIndex
CREATE INDEX "Book_translationId_idx" ON "Book"("translationId");

-- CreateIndex
CREATE UNIQUE INDEX "Book_translationId_bookReferenceId_key" ON "Book"("translationId", "bookReferenceId");

-- CreateIndex
CREATE INDEX "Verse_bookId_chapter_idx" ON "Verse"("bookId", "chapter");

-- CreateIndex
CREATE UNIQUE INDEX "Verse_bookId_chapter_verse_key" ON "Verse"("bookId", "chapter", "verse");

-- AddForeignKey
ALTER TABLE "Book" ADD CONSTRAINT "Book_translationId_fkey" FOREIGN KEY ("translationId") REFERENCES "Translation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Verse" ADD CONSTRAINT "Verse_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

