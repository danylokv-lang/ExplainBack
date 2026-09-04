import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { currentUser } from "@/lib/auth";
import { getStats } from "@/lib/db";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/login");

  const stats = await getStats(user.id);

  return (
    <AppShell user={user} dueCards={stats.dueCards}>
      {children}
    </AppShell>
  );
}
