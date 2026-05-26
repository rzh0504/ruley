import { requireSession } from "@/lib/auth/session";
import { DashboardWorkspace } from "@/components/dashboard/dashboard-workspace";
import { findConfigByPublicId, serializeConfigRecord } from "@/lib/server/config-records";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ configId?: string }> }) {
  await requireSession();
  const configId = (await searchParams).configId;
  const config = configId ? await findConfigByPublicId(configId) : undefined;
  return <DashboardWorkspace initialConfig={config ? serializeConfigRecord(config) : null} />;
}
