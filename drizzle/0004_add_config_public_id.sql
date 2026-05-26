ALTER TABLE "configs" ADD COLUMN IF NOT EXISTS "public_id" text;
UPDATE "configs"
SET "public_id" = 'cfg_' || substr(md5("id"::text || "created_at"::text || random()::text), 1, 18)
WHERE "public_id" IS NULL;
ALTER TABLE "configs" ALTER COLUMN "public_id" SET NOT NULL;
ALTER TABLE "configs" ADD CONSTRAINT "configs_public_id_unique" UNIQUE("public_id");
