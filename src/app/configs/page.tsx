import { requireSession } from "@/lib/auth/session";
import { ConfigsClient } from "@/components/configs/configs-client";

export default async function ConfigsPage() {
  await requireSession();
  return <ConfigsClient />;
}
