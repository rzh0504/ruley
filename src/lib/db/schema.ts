import { relations, sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export type JsonProxyGroup = Record<string, unknown>;
export type JsonRule = Record<string, unknown>;
export type JsonProxy = Record<string, unknown>;

export const configs = pgTable("configs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  urls: text("urls").notNull(),
  platform: text("platform").notNull().default("mihomo"),
  advancedDns: boolean("advanced_dns").notNull().default(false),
  proxyGroups: jsonb("proxy_groups")
    .$type<JsonProxyGroup[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  rules: jsonb("rules")
    .$type<JsonRule[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  nodeCount: integer("node_count").notNull().default(0),
  parsedNodes: jsonb("parsed_nodes").$type<JsonProxy[]>(),
  generatedConfig: text("generated_config"),
  parentId: integer("parent_id").references((): AnyPgColumn => configs.id, { onDelete: "cascade" }),
  cloudToken: text("cloud_token").unique(),
  cloudUrl: text("cloud_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const configRelations = relations(configs, ({ one, many }) => ({
  parent: one(configs, {
    fields: [configs.parentId],
    references: [configs.id],
    relationName: "configBranches",
  }),
  branches: many(configs, { relationName: "configBranches" }),
}));

export type Config = typeof configs.$inferSelect;
export type NewConfig = typeof configs.$inferInsert;
