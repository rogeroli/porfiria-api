CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');
CREATE TYPE "TrailStatus" AS ENUM ('DRAFT', 'PUBLISHED');
CREATE TYPE "TrailItemType" AS ENUM ('QUIZ', 'VIDEO');

ALTER TABLE "users" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'USER';

CREATE TABLE "trails" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "status" "TrailStatus" NOT NULL DEFAULT 'DRAFT',
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "trails_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "trail_items" (
  "id" TEXT NOT NULL,
  "trailId" TEXT NOT NULL,
  "type" "TrailItemType" NOT NULL,
  "order" INTEGER NOT NULL,
  "question" TEXT,
  "videoPath" TEXT,
  "videoOriginalName" TEXT,
  "videoMimeType" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "trail_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "quiz_options" (
  "id" TEXT NOT NULL,
  "trailItemId" TEXT NOT NULL,
  "text" TEXT NOT NULL,
  "isCorrect" BOOLEAN NOT NULL,
  "order" INTEGER NOT NULL,

  CONSTRAINT "quiz_options_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "trail_items_trailId_order_key" ON "trail_items"("trailId", "order");
CREATE UNIQUE INDEX "quiz_options_trailItemId_order_key" ON "quiz_options"("trailItemId", "order");

ALTER TABLE "trails" ADD CONSTRAINT "trails_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "trail_items" ADD CONSTRAINT "trail_items_trailId_fkey" FOREIGN KEY ("trailId") REFERENCES "trails"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "quiz_options" ADD CONSTRAINT "quiz_options_trailItemId_fkey" FOREIGN KEY ("trailItemId") REFERENCES "trail_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
