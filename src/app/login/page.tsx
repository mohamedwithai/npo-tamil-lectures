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
      </div>
    </div>
  );
}
