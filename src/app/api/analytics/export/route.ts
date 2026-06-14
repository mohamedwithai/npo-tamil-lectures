import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/session";
import { eventsCsv } from "@/lib/analytics";

export const runtime = "nodejs";

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const csv = await eventsCsv();
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="events-${new Date()
        .toISOString()
        .slice(0, 10)}.csv"`,
    },
  });
}
