import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { currentUser } from "@/lib/auth";
import { getStats } from "@/lib/db";
import { getLocale } from "@/lib/i18n";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/login");

  const [stats, locale] = await Promise.all([getStats(user.id), getLocale()]);

  return (
    <AppShell user={user} dueCards={stats.dueCards} locale={locale}>
      {children}
    </AppShell>
  );
}
