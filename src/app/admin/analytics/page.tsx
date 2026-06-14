import { getDashboardData } from "@/lib/analytics";
import { AnalyticsCharts } from "@/components/admin/analytics-charts";

export default async function AdminAnalyticsPage() {
  const data = await getDashboardData();
  return <AnalyticsCharts data={data} />;
}
