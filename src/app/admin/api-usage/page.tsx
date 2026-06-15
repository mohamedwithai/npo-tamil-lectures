import { Activity, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getApiUsage, type ApiCounters } from "@/lib/api-usage";

export const dynamic = "force-dynamic";

// Human label + blurb for each tracked provider.
const PROVIDERS: Record<string, { name: string; desc: string }> = {
  gemini: {
    name: "Gemini (NotebookLM mind maps)",
    desc: "Called when an admin posts or edits a lecture, or previews a mind map.",
  },
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

export default async function ApiUsagePage() {
  const usage = await getApiUsage();
  const entries = Object.entries(usage);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">API Usage</h1>
        <p className="text-sm text-muted-foreground">
          Running totals of external API calls made by the platform.
        </p>
      </div>

      {entries.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            No API calls recorded yet. Counters start once a mind map is
            generated.
          </CardContent>
        </Card>
      ) : (
        entries.map(([provider, counters]) => (
          <ProviderCard key={provider} provider={provider} counters={counters} />
        ))
      )}
    </div>
  );
}

function ProviderCard({
  provider,
  counters,
}: {
  provider: string;
  counters: ApiCounters;
}) {
  const meta = PROVIDERS[provider] ?? { name: provider, desc: "" };
  const rate =
    counters.total > 0
      ? Math.round((counters.success / counters.total) * 100)
      : 0;

  const stats = [
    { label: "Total calls", value: counters.total, icon: Activity },
    { label: "Successful", value: counters.success, icon: CheckCircle2 },
    { label: "Failed / fallback", value: counters.failed, icon: XCircle },
  ];

  return (
    <Card>
      <CardContent className="space-y-5 p-6">
        <div>
          <h2 className="font-semibold">{meta.name}</h2>
          {meta.desc && (
            <p className="text-sm text-muted-foreground">{meta.desc}</p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <s.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-x-8 gap-y-2 border-t pt-4 text-sm">
          <span className="text-muted-foreground">
            Success rate: <span className="font-medium text-foreground">{rate}%</span>
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            Last call: {formatDate(counters.lastCalledAt)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
