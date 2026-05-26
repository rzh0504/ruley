ALTER TABLE "configs" ADD COLUMN "settings" jsonb DEFAULT '{}'::jsonb NOT NULL;
