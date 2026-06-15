"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b bg-gradient-to-b from-accent/40 to-background">
      <div className="container py-20 text-center sm:py-28">
        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="mx-auto max-w-3xl font-tamil text-4xl font-bold leading-tight sm:text-5xl"
        >
          அறிவையும் ஈமானையும் வளர்க்கும் தமிழ் சொற்பொழிவுகள்
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:text-lg"
        >
          Read thoughtfully written Tamil lectures, reflect on Quran references, and test
          your understanding — all in one calm, distraction-free place.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mt-8 flex justify-center gap-3"
        >
          <Button size="lg" asChild>
            <Link href="/lectures">
              Browse lectures <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/search">Search</Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
