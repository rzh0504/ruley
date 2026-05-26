ALTER TABLE "configs" ADD COLUMN IF NOT EXISTS "settings" jsonb DEFAULT '{}'::jsonb;
UPDATE "configs" SET "settings" = '{}'::jsonb WHERE "settings" IS NULL;
ALTER TABLE "configs" ALTER COLUMN "settings" SET DEFAULT '{}'::jsonb;
ALTER TABLE "configs" ALTER COLUMN "settings" SET NOT NULL;
ALTER TABLE "configs" DROP COLUMN IF EXISTS "advanced_dns";
