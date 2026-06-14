import Link from "next/link";
import Image from "next/image";
import { Clock, Calendar, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import type { LectureCardData } from "@/components/lecture/lecture-card";

export function FeaturedLecture({ lecture }: { lecture: LectureCardData }) {
  return (
    <Link href={`/lectures/${lecture.slug}`} className="group block">
      <Card className="grid overflow-hidden md:grid-cols-2">
        <div className="relative aspect-[16/10] bg-muted md:aspect-auto">
          {lecture.featuredImage ? (
            <Image
              src={lecture.featuredImage}
              alt={lecture.titleTa}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              priority
            />
          ) : (
            <div className="flex h-full min-h-56 items-center justify-center bg-gradient-to-br from-primary/15 to-accent">
              <span className="font-tamil text-5xl text-primary/40">சொல்</span>
            </div>
          )}
        </div>
        <div className="flex flex-col justify-center gap-3 p-8">
          <Badge variant="secondary" className="w-fit">
            Featured
          </Badge>
          <h3 className="font-tamil text-2xl font-bold leading-snug group-hover:text-primary">
            {lecture.titleTa}
          </h3>
          {lecture.titleEn && (
            <p className="text-sm font-medium text-muted-foreground">{lecture.titleEn}</p>
          )}
          <p className="line-clamp-3 font-tamil text-muted-foreground">{lecture.summary}</p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" /> {formatDate(lecture.publishedAt)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {lecture.readTime} min read
            </span>
          </div>
          <span className="mt-2 flex items-center gap-1 text-sm font-medium text-primary">
            Read lecture <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </Card>
    </Link>
  );
}
