"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import { Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { DashboardData } from "@/lib/analytics";

export function AnalyticsCharts({ data }: { data: DashboardData }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <Button asChild variant="outline">
          <a href="/api/analytics/export">
            <Download className="h-4 w-4" /> Export CSV
          </a>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total Users" value={data.totals.users} />
        <Stat label="Lectures" value={data.totals.lectures} />
        <Stat label="Lecture Views" value={data.totals.views} />
        <Stat label="Completion Rate" value={`${data.totals.completionRate}%`} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Activity (last 30 days)</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.activityTimeline}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" fontSize={11} tickLine={false} />
              <YAxis fontSize={11} tickLine={false} allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="events" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Events" />
              <Line type="monotone" dataKey="logins" stroke="#f59e0b" strokeWidth={2} dot={false} name="Logins" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Most Viewed Lectures</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {data.mostViewed.length === 0 ? (
              <Empty />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.mostViewed} layout="vertical" margin={{ left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                  <XAxis type="number" fontSize={11} allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="titleTa"
                    width={120}
                    fontSize={11}
                    tickFormatter={(v: string) => (v.length > 16 ? v.slice(0, 16) + "…" : v)}
                  />
                  <Tooltip />
                  <Bar dataKey="views" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Views" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Most Completed Lectures</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {data.mostCompleted.length === 0 ? (
              <Empty />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.mostCompleted} layout="vertical" margin={{ left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                  <XAxis type="number" fontSize={11} allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="titleTa"
                    width={120}
                    fontSize={11}
                    tickFormatter={(v: string) => (v.length > 16 ? v.slice(0, 16) + "…" : v)}
                  />
                  <Tooltip />
                  <Bar dataKey="completions" fill="#10b981" radius={[0, 4, 4, 0]} name="Completions" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

function Empty() {
  return (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      No data yet.
    </div>
  );
}
