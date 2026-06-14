import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";

// ─────────────────────────────────────────────────────────────────────────────
// LOCAL DEV ONLY. Creates/uses a default user and a database session so you can
// test member/admin features on localhost WITHOUT Google OAuth. This route is
// disabled in production (returns 404), so it never affects the live site or the
// Google OAuth client / Search Console.
//   Visit: http://localhost:3000/dev-login        → sign in as the dev admin
//          http://localhost:3000/dev-login?role=MEMBER → sign in as a member
// ─────────────────────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse("Not found", { status: 404 });
  }

  const url = new URL(req.url);
  const role = url.searchParams.get("role") === "MEMBER" ? "MEMBER" : "ADMIN";
  const email = role === "MEMBER" ? "member@localhost" : "dev@localhost";
  const name = role === "MEMBER" ? "Dev Member" : "Dev Admin";

  const user = await prisma.user.upsert({
    where: { email },
    update: { role },
    create: { email, name, role },
  });

  const sessionToken = randomUUID();
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  await prisma.session.create({
    data: { sessionToken, userId: user.id, expires },
  });

  const res = NextResponse.redirect(new URL("/", url.origin));
  // Auth.js v5 default DB-session cookie name on http (non-secure) localhost.
  res.cookies.set("authjs.session-token", sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires,
  });
  return res;
}
