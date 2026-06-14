import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { LoginButton } from "@/components/layout/login-button";
import { BookOpen } from "lucide-react";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  const user = await getCurrentUser();
  if (user) redirect(callbackUrl || "/");

  return (
    <div className="container flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-sm rounded-2xl border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <BookOpen className="h-6 w-6 text-primary" />
        </div>
        <h1 className="font-tamil text-2xl font-bold">உள்நுழைக</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in to read full lectures, view Quran references and take quizzes.
        </p>
        <div className="mt-6">
          <LoginButton callbackUrl={callbackUrl || "/"} />
        </div>

        {process.env.NODE_ENV !== "production" && (
          <div className="mt-6 space-y-2 rounded-lg border border-dashed p-3 text-left">
            <p className="text-xs font-semibold text-muted-foreground">
              Local dev only (no Google)
            </p>
            <div className="flex flex-col gap-2">
              <a
                href="/dev-login"
                className="rounded-md bg-secondary px-3 py-1.5 text-center text-sm font-medium text-secondary-foreground hover:bg-secondary/80"
              >
                Continue as Dev Admin
              </a>
              <a
                href="/dev-login?role=MEMBER"
                className="rounded-md border px-3 py-1.5 text-center text-sm font-medium hover:bg-muted"
              >
                Continue as Dev Member
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
