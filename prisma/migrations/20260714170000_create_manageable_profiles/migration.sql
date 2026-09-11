DO $$ BEGIN
  CREATE TYPE "ProfileStatus" AS ENUM ('ACTIVE', 'DISABLED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "profiles" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "status" "ProfileStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "profiles_code_key" ON "profiles"("code");

INSERT INTO "profiles" ("id", "code", "name", "description", "status", "createdAt", "updatedAt") VALUES
  ('11111111-1111-4111-8111-111111111111', 'PATIENT', 'Paciente', 'Perfil destinado a pacientes.', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('22222222-2222-4222-8222-222222222222', 'DOCTOR', 'Medico', 'Perfil destinado a medicos.', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('33333333-3333-4333-8333-333333333333', 'RESEARCHER', 'Pesquisador', 'Perfil destinado a pesquisadores.', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "profileId" TEXT;

UPDATE "users" SET "profileId" = CASE "profile"::text
  WHEN 'PATIENT' THEN '11111111-1111-4111-8111-111111111111'
  WHEN 'DOCTOR' THEN '22222222-2222-4222-8222-222222222222'
  WHEN 'RESEARCHER' THEN '33333333-3333-4333-8333-333333333333'
  ELSE '11111111-1111-4111-8111-111111111111'
END
WHERE "profileId" IS NULL;

ALTER TABLE "users" ALTER COLUMN "profileId" SET NOT NULL;

DO $$ BEGIN
  ALTER TABLE "users" ADD CONSTRAINT "users_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "profile_trails" (
  "profileId" TEXT NOT NULL,
  "trailId" TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  CONSTRAINT "profile_trails_pkey" PRIMARY KEY ("profileId", "trailId"),
  CONSTRAINT "profile_trails_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "profile_trails_trailId_fkey" FOREIGN KEY ("trailId") REFERENCES "trails"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "profile_trails_profileId_order_key" ON "profile_trails"("profileId", "order");

INSERT INTO "profile_trails" ("profileId", "trailId", "order")
SELECT "profileId", "trailId", ROW_NUMBER() OVER (PARTITION BY "profileId" ORDER BY "createdAt", "trailId")
FROM (
  SELECT p."id" AS "profileId", t."id" AS "trailId", t."createdAt"
  FROM "trails" t
  JOIN "profiles" p ON p."code" = ANY(t."targetProfiles"::text[])
) migrated
ON CONFLICT ("profileId", "trailId") DO NOTHING;

ALTER TABLE "users" DROP COLUMN IF EXISTS "profile";
ALTER TABLE "trails" DROP COLUMN IF EXISTS "targetProfiles";
