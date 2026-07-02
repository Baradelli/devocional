-- A disponibilidade do devocional passa a ser puramente por data (date <= hoje),
-- tornando `publishedAt` redundante. Removida junto com o job de publicação 00h.
ALTER TABLE "Devotional" DROP COLUMN "publishedAt";
