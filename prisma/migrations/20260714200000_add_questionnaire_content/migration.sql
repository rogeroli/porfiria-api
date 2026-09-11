CREATE TYPE "QuestionnaireContentFormat" AS ENUM ('HTML', 'TXT', 'VIDEO', 'PDF');

ALTER TABLE "questionnaires"
  ADD COLUMN "contentFormat" "QuestionnaireContentFormat" NOT NULL DEFAULT 'TXT',
  ADD COLUMN "contentText" TEXT,
  ADD COLUMN "contentFilePath" TEXT,
  ADD COLUMN "contentFileOriginalName" TEXT,
  ADD COLUMN "contentFileMimeType" TEXT;

ALTER TABLE "questionnaires" ALTER COLUMN "contentFormat" DROP DEFAULT;
