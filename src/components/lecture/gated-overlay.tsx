"use client";

import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Shown to guests after the free preview. The gated content itself is NOT in the
 * DOM (the server never sent it), so this is a real gate, not a CSS trick. The
 * blurred strip is a teaser made of the preview's trailing edge via a gradient.
 */
export function GatedOverlay({ callbackUrl }: { callbackUrl: string }) {
  return (
    <div className="relative">
      {/* Fade-out gradient over the last lines of the preview */}
      <div className="pointer-events-none absolute inset-x-0 -top-32 h-32 bg-gradient-to-b from-transparent to-background" />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative mx-auto max-w-md rounded-2xl border bg-card p-8 text-center shadow-lg"
      >
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Lock className="h-6 w-6 text-primary" />
        </div>
        <h3 className="font-tamil text-xl font-bold">தொடர்ந்து படிக்க உள்நுழையவும்</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Login to continue reading the full lecture, access Quran references and take the quiz.
          It’s free.
        </p>
        <Button
          className="mt-6 w-full"
          size="lg"
          onClick={() => signIn("google", { callbackUrl })}
        >
          <GoogleIcon /> Continue with Google
        </Button>
        <p className="mt-3 text-xs text-muted-foreground">
          You’ll return to this lecture right where you left off.
        </p>
      </motion.div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path
        fill="currentColor"
        d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.05 1.05-2.7 2.2-5.59 2.2-4.45 0-7.93-3.59-7.93-8.04s3.48-8.04 7.93-8.04c2.4 0 4.16.95 5.46 2.16l2.31-2.31C18.7 1.16 16.2 0 12.48 0 5.6 0 0 5.6 0 12.48s5.6 12.48 12.48 12.48c3.6 0 6.31-1.18 8.42-3.38 2.17-2.17 2.85-5.22 2.85-7.69 0-.76-.07-1.46-.18-2.06H12.48z"
      />
    </svg>
  );
}
