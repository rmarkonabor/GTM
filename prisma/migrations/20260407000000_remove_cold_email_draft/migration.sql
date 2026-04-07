-- Remove the cold email draft column.
-- Existing project data (steps, campaigns, etc.) is preserved.
ALTER TABLE "Project" DROP COLUMN IF EXISTS "coldEmailDraft";
