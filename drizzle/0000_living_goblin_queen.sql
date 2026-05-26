CREATE TABLE "configs" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"urls" text NOT NULL,
	"platform" text DEFAULT 'mihomo' NOT NULL,
	"advanced_dns" boolean DEFAULT false NOT NULL,
	"proxy_groups" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"rules" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"node_count" integer DEFAULT 0 NOT NULL,
	"parsed_nodes" jsonb,
	"generated_config" text,
	"parent_id" integer,
	"cloud_token" text,
	"cloud_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "configs_cloud_token_unique" UNIQUE("cloud_token")
);
--> statement-breakpoint
ALTER TABLE "configs" ADD CONSTRAINT "configs_parent_id_configs_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."configs"("id") ON DELETE cascade ON UPDATE no action;