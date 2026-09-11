ALTER TYPE "TrailStatus" RENAME TO "QuestionnaireStatus";
ALTER TYPE "TrailItemType" RENAME TO "QuestionnaireItemType";

ALTER TABLE "trails" RENAME TO "questionnaires";
ALTER TABLE "trail_items" RENAME TO "questionnaire_items";

ALTER TABLE "profile_trails" RENAME COLUMN "trailId" TO "questionnaireId";
ALTER TABLE "questionnaire_items" RENAME COLUMN "trailId" TO "questionnaireId";
ALTER TABLE "quiz_options" RENAME COLUMN "trailItemId" TO "questionnaireItemId";

ALTER INDEX IF EXISTS "trail_items_trailId_order_key" RENAME TO "questionnaire_items_questionnaireId_order_key";
ALTER INDEX IF EXISTS "quiz_options_trailItemId_order_key" RENAME TO "quiz_options_questionnaireItemId_order_key";
