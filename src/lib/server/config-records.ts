import { desc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { configs } from "@/lib/db/schema";

export const listConfigSummaries = () =>
  db.select({
    id: configs.id,
    publicId: configs.publicId,
    name: configs.name,
    nodeCount: configs.nodeCount,
    cloudToken: configs.cloudToken,
    cloudUrl: configs.cloudUrl,
    parentId: configs.parentId,
    updatedAt: configs.updatedAt,
  }).from(configs).orderBy(isNull(configs.parentId), desc(configs.updatedAt));

export const findConfigByPublicId = async (publicId: string) => {
  const [row] = await db.select().from(configs).where(eq(configs.publicId, publicId)).limit(1);
  return row;
};

export const serializeConfigSummary = (row: Awaited<ReturnType<typeof listConfigSummaries>>[number]) => ({
  ...row,
  updatedAt: row.updatedAt.toISOString(),
});

export const serializeConfigRecord = (row: NonNullable<Awaited<ReturnType<typeof findConfigByPublicId>>>) => ({
  ...row,
  proxyGroups: row.proxyGroups as any,
  rules: row.rules as any,
  parsedNodes: row.parsedNodes as any,
  settings: row.settings as any,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});
