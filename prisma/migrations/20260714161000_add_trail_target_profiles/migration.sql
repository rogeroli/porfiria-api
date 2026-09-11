ALTER TABLE "trails" ADD COLUMN "targetProfiles" "UserProfile"[] NOT NULL DEFAULT ARRAY['PATIENT', 'DOCTOR', 'RESEARCHER']::"UserProfile"[];
