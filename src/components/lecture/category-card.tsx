import Link from "next/link";
import type { Category } from "@/lib/categories";

/** Colourful, hover-lifting tile for a content category. */
export function CategoryCard({
  category,
  count,
}: {
  category: Category;
  count?: number;
}) {
  const Icon = category.icon;
  return (
    <Link
      href={`/topics/${category.slug}`}
      className="group relative overflow-hidden rounded-xl border bg-card p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
    >
      <span
        className="flex h-12 w-12 items-center justify-center rounded-xl text-white transition-transform duration-200 group-hover:scale-105"
        style={{ backgroundColor: category.color }}
      >
        <Icon className="h-6 w-6" />
      </span>
      <h3 className="mt-3 font-tamil text-base font-bold leading-snug">{category.nameTa}</h3>
      <p className="text-xs text-muted-foreground">{category.nameEn}</p>
      {typeof count === "number" && (
        <p className="mt-1 font-tamil text-xs text-muted-foreground">
          {count} சொற்பொழிவுகள்
        </p>
      )}
      <span
        className="absolute inset-x-0 bottom-0 h-1 opacity-80"
        style={{ backgroundColor: category.color }}
      />
    </Link>
  );
}
