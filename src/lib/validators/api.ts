import { z } from "zod";

export const loginSchema = z.object({
  password: z.string().min(1),
});

export const parseSchema = z.object({
  urls: z.string().min(1),
});

export const generateSchema = z.object({
  proxies: z.array(z.record(z.string(), z.unknown())),
  proxyGroups: z.array(z.record(z.string(), z.unknown())).default([]),
  rules: z.array(z.record(z.string(), z.unknown())).default([]),
  settings: z.record(z.string(), z.unknown()).default({}),
});

export const cloudSaveSchema = z.object({
  urls: z.string().min(1),
  configId: z.coerce.number().int().positive().optional().nullable(),
  parentId: z.coerce.number().int().positive().optional().nullable(),
  name: z.string().optional(),
  proxyGroups: z.array(z.record(z.string(), z.unknown())).default([]),
  rules: z.array(z.record(z.string(), z.unknown())).default([]),
  advancedDns: z.boolean().default(true),
  parsedNodes: z.array(z.record(z.string(), z.unknown())).default([]),
  generatedConfig: z.string().optional(),
});

export const configCreateSchema = cloudSaveSchema.extend({
  name: z.string().min(1),
});

export const configUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  urls: z.string().min(1).optional(),
  proxyGroups: z.array(z.record(z.string(), z.unknown())).optional(),
  rules: z.array(z.record(z.string(), z.unknown())).optional(),
  advancedDns: z.boolean().optional(),
  parsedNodes: z.array(z.record(z.string(), z.unknown())).optional(),
});
