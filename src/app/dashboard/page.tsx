import { requireSession } from "@/lib/auth/session";
import { DashboardWorkspace } from "@/components/dashboard/dashboard-workspace";

export default async function DashboardPage() {
  await requireSession();
  return <DashboardWorkspace />;
}
