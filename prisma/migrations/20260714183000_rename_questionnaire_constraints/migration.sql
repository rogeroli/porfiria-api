ALTER TABLE "questionnaire_items" RENAME CONSTRAINT "trail_items_pkey" TO "questionnaire_items_pkey";
ALTER TABLE "questionnaires" RENAME CONSTRAINT "trails_pkey" TO "questionnaires_pkey";
ALTER TABLE "profile_trails" RENAME CONSTRAINT "profile_trails_trailId_fkey" TO "profile_trails_questionnaireId_fkey";
ALTER TABLE "questionnaire_items" RENAME CONSTRAINT "trail_items_trailId_fkey" TO "questionnaire_items_questionnaireId_fkey";
ALTER TABLE "questionnaires" RENAME CONSTRAINT "trails_createdById_fkey" TO "questionnaires_createdById_fkey";
ALTER TABLE "quiz_options" RENAME CONSTRAINT "quiz_options_trailItemId_fkey" TO "quiz_options_questionnaireItemId_fkey";
