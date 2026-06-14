import { NextResponse, type NextRequest } from "next/server";
import { searchLectures } from "@/lib/search";
import { searchSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
  const limited = await rateLimit(`search:${ip}`, 60, 60);
  if (!limited.success) {
    return NextResponse.json({ results: [] }, { status: 429 });
  }

  const parsed = searchSchema.safeParse({ q: req.nextUrl.searchParams.get("q") ?? "" });
  if (!parsed.success) {
    return NextResponse.json({ results: [] });
  }

  const results = await searchLectures(parsed.data.q);
  return NextResponse.json(
    { results },
    { headers: { "Cache-Control": "public, max-age=15, s-maxage=30" } }
  );
}
