import { requireSession } from "@/lib/auth/session";
import { ConfigsClient } from "@/components/configs/configs-client";
import { listConfigSummaries, serializeConfigSummary } from "@/lib/server/config-records";

export default async function ConfigsPage() {
  await requireSession();
  const configs = await listConfigSummaries();
  return <ConfigsClient initialConfigs={configs.map(serializeConfigSummary)} />;
}
