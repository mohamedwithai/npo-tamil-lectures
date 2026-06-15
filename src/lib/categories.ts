// ───────────────────────────────────────────────────────────────────────────
// Content taxonomy. Categories are a fixed, code-defined set (an NPO with a
// stable subject list benefits from the simplicity + type-safety of config over
// an editable table). Lectures/articles/books reference a category by `slug`.
// Each category carries its own accent colour (light + dark) and a lucide icon
// name so the UI can stay colourful but consistent.
// ───────────────────────────────────────────────────────────────────────────
import type { LucideIcon } from "lucide-react";
import {
  BookOpenText,
  Scale,
  Landmark,
  Sparkles,
  ScrollText,
  Hourglass,
  HeartHandshake,
  Compass,
} from "lucide-react";

export type Category = {
  slug: string;
  nameTa: string;
  nameEn: string;
  descTa: string;
  icon: LucideIcon;
  /** Accent colour for light and dark themes (hex). */
  color: string;
  colorDark: string;
};

export const CATEGORIES: Category[] = [
  {
    slug: "islam",
    nameTa: "இஸ்லாம் அடிப்படைகள்",
    nameEn: "Islam Basics",
    descTa: "ஈமான், இபாதத், அறிமுகம்",
    icon: Sparkles,
    color: "#4f46e5",
    colorDark: "#818cf8",
  },
  {
    slug: "fiqh",
    nameTa: "ஃபிக்ஹ்",
    nameEn: "Fiqh",
    descTa: "வணக்கம், பரிவர்த்தனை சட்டங்கள்",
    icon: Scale,
    color: "#0284c7",
    colorDark: "#38bdf8",
  },
  {
    slug: "usul",
    nameTa: "உஸூல்கள்",
    nameEn: "Usul",
    descTa: "உஸூலுல் ஃபிக்ஹ் & ஹதீஸ்",
    icon: Compass,
    color: "#c026d3",
    colorDark: "#e879f9",
  },
  {
    slug: "history",
    nameTa: "வரலாறு & சீரா",
    nameEn: "History & Seerah",
    descTa: "நபிமார்கள், கலீஃபாக்கள்",
    icon: Hourglass,
    color: "#e11d48",
    colorDark: "#fb7185",
  },
  {
    slug: "quran",
    nameTa: "குர்ஆன்",
    nameEn: "Quran",
    descTa: "வசனங்கள் & விளக்கம்",
    icon: BookOpenText,
    color: "#0d9488",
    colorDark: "#2dd4bf",
  },
  {
    slug: "hadith",
    nameTa: "ஹதீஸ்",
    nameEn: "Hadith",
    descTa: "நபிமொழிகள்",
    icon: ScrollText,
    color: "#d97706",
    colorDark: "#fbbf24",
  },
  {
    slug: "akhlaq",
    nameTa: "ஒழுக்கம்",
    nameEn: "Akhlaq & Manners",
    descTa: "நற்பண்புகள், ஆன்மிகம்",
    icon: HeartHandshake,
    color: "#059669",
    colorDark: "#34d399",
  },
  {
    slug: "general",
    nameTa: "ஏனையவை",
    nameEn: "General",
    descTa: "பிற தலைப்புகள்",
    icon: Landmark,
    color: "#475569",
    colorDark: "#94a3b8",
  },
];

const BY_SLUG = new Map(CATEGORIES.map((c) => [c.slug, c]));

export function getCategory(slug: string | null | undefined): Category | undefined {
  return slug ? BY_SLUG.get(slug) : undefined;
}

export const CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug);
