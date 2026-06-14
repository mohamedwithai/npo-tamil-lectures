import NextAuth, { type DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

// Augment the session/user types so `session.user.role` and `.id` are typed.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }
  interface User {
    role?: Role;
  }
}

function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  // Database sessions: the adapter persists the session row, so we can revoke
  // and we always read the authoritative role from the DB.
  session: { strategy: "database" },
  pages: { signIn: "/login" },
  providers: [
    Google({
      authorization: {
        params: { prompt: "select_account", access_type: "offline" },
      },
    }),
  ],
  callbacks: {
    // Expose id + role on the session object for RSC/route guards.
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = (user as { role?: Role }).role ?? "MEMBER";
      }
      return session;
    },
  },
  events: {
    // Grant ADMIN to configured emails on account creation; record a login event.
    async createUser({ user }) {
      if (user.email && adminEmails().includes(user.email.toLowerCase())) {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: "ADMIN" },
        });
      }
    },
    async signIn({ user }) {
      if (user?.id) {
        await prisma.event.create({
          data: { type: "login", userId: user.id },
        });
      }
    },
  },
});
