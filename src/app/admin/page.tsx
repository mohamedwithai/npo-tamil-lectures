import Link from "next/link";
import { FileText, Users, Eye, ListChecks, Plus, Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getDashboardData } from "@/lib/analytics";
import { getApiUsage } from "@/lib/api-usage";

export default async function AdminDashboard() {
  const [data, apiUsage] = await Promise.all([getDashboardData(), getApiUsage()]);
  const stats = [
    { label: "Total Users", value: data.totals.users, icon: Users },
    { label: "Lectures", value: data.totals.lectures, icon: FileText },
    { label: "Total Views", value: data.totals.views, icon: Eye },
    { label: "Quiz Participation", value: data.totals.quizParticipation, icon: ListChecks },
    { label: "Gemini API Calls", value: apiUsage.gemini?.total ?? 0, icon: Activity },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button asChild>
          <Link href="/admin/lectures/new">
            <Plus className="h-4 w-4" /> New lecture
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
                <s.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <QuickLink href="/admin/lectures" title="Manage lectures" desc="Create, edit, publish" />
        <QuickLink href="/admin/quran" title="Quran verses" desc="Add & link verses" />
        <QuickLink href="/admin/analytics" title="Analytics" desc="Views, completion, export" />
      </div>
    </div>
  );
}

function QuickLink({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link href={href}>
      <Card className="transition-colors hover:bg-accent/40">
        <CardContent className="p-5">
          <p className="font-semibold">{title}</p>
          <p className="text-sm text-muted-foreground">{desc}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
