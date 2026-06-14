"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Clock, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

export type LectureCardData = {
  slug: string;
  titleTa: string;
  titleEn: string | null;
  summary: string;
  featuredImage: string | null;
  publishedAt: Date | string | null;
  readTime: number;
};

export function LectureCard({ lecture, index = 0 }: { lecture: LectureCardData; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.3) }}
      whileHover={{ y: -4 }}
    >
      <Link href={`/lectures/${lecture.slug}`} className="group block h-full">
        <Card className="h-full overflow-hidden transition-shadow hover:shadow-md">
          <div className="relative aspect-[16/9] overflow-hidden bg-muted">
            {lecture.featuredImage ? (
              <Image
                src={lecture.featuredImage}
                alt={lecture.titleTa}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/15 to-accent">
                <span className="font-tamil text-3xl text-primary/40">சொல்</span>
              </div>
            )}
          </div>
          <div className="space-y-2 p-5">
            <h3 className="font-tamil text-lg font-bold leading-snug group-hover:text-primary">
              {lecture.titleTa}
            </h3>
            {lecture.titleEn && (
              <p className="text-xs font-medium text-muted-foreground">{lecture.titleEn}</p>
            )}
            <p className="line-clamp-2 font-tamil text-sm text-muted-foreground">
              {lecture.summary}
            </p>
            <div className="flex items-center gap-3 pt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" /> {formatDate(lecture.publishedAt)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> {lecture.readTime} min
              </span>
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}
