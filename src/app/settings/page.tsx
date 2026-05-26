import { SettingsClient } from "@/components/settings/settings-client";
import { requireSession } from "@/lib/auth/session";

export default async function SettingsPage() {
  await requireSession();
  return <SettingsClient />;
}
