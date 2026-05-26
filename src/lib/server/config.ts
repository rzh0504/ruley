import crypto from "crypto";
import { parseInput } from "@/lib/server/parser";
import { generateConfig } from "@/lib/server/generator";
import { getActiveSubscriptionInput } from "@/lib/subscription-sources";

const tokenBytes = 32;

export const getSubscriptionName = (value?: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : "ruley";

export const createCloudToken = () => crypto.randomBytes(tokenBytes).toString("hex");

export const buildSubUrl = (token: string, name?: unknown) =>
  `/api/sub/${token}/${encodeURIComponent(getSubscriptionName(name))}`;

export const getSafeFilename = (value?: unknown) =>
  getSubscriptionName(value).replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-");

export const buildPublicUrl = (request: Request, path: string) => {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (configured) return `${configured}${path}`;

  const vercelUrl = process.env.VERCEL_URL?.replace(/\/$/, "");
  if (vercelUrl) return `https://${vercelUrl}${path}`;

  const url = new URL(request.url);
  return `${url.origin}${path}`;
};

export const buildCurrentConfig = async ({
  urls,
  parsedNodes,
  proxyGroups,
  rules,
  advancedDns,
}: {
  urls?: string;
  parsedNodes?: unknown;
  proxyGroups?: unknown;
  rules?: unknown;
  advancedDns?: boolean | number;
}) => {
  const proxies = Array.isArray(parsedNodes) && parsedNodes.length > 0
    ? parsedNodes
    : (await parseInput(getActiveSubscriptionInput(urls || ""))).proxies;
  const groups = Array.isArray(proxyGroups) ? proxyGroups : [];
  const ruleItems = Array.isArray(rules) ? rules : [];
  const yamlStr = generateConfig({
    proxies,
    proxyGroups: groups as any,
    rules: ruleItems as any,
    settings: { advancedDns: advancedDns === true || advancedDns === 1 },
  });

  return {
    yamlStr,
    proxies: proxies as Record<string, unknown>[],
    nodeCount: proxies.length,
  };
};
