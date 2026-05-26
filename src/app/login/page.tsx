import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return <LoginForm />;
}
