"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function LoginButton({ callbackUrl = "/" }: { callbackUrl?: string }) {
  return (
    <Button size="lg" className="w-full" onClick={() => signIn("google", { callbackUrl })}>
      <GoogleIcon /> Continue with Google
    </Button>
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
