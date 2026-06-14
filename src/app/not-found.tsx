import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="text-6xl font-bold text-primary">404</p>
      <h1 className="mt-4 font-tamil text-2xl font-bold">பக்கம் கிடைக்கவில்லை</h1>
      <p className="mt-2 text-muted-foreground">
        The page you’re looking for doesn’t exist or was moved.
      </p>
      <Button asChild className="mt-6">
        <Link href="/">Back to home</Link>
      </Button>
    </div>
  );
}
