import { redirect } from "next/navigation";
import { auth } from "@/auth";

/** Returns the current session user or null. Safe in RSC. */
export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function isAuthenticated() {
  return (await getCurrentUser()) !== null;
}

export async function isAdmin() {
  const user = await getCurrentUser();
  return user?.role === "ADMIN";
}

/** Guard for member-only server actions/pages. Redirects to /login. */
export async function requireUser(callbackUrl?: string) {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`);
  }
  return user;
}

/** Guard for admin-only server actions/pages. */
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/");
  return user;
}
