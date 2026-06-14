// One-off backfill: generate a mind map for every lecture that doesn't have one.
// Uses the deterministic heading-based generator (same output the app uses when
// GEMINI_API_KEY is unset). Safe to re-run; only fills nulls.
//   npx tsx prisma/backfill-mindmap.ts
import { PrismaClient } from "@prisma/client";
import { buildMindMapFromHtml } from "../src/lib/mindmap";

const prisma = new PrismaClient();

async function main() {
  const all = await prisma.lecture.findMany({
    select: { id: true, slug: true, titleTa: true, content: true, mindMap: true },
  });
  const lectures = all.filter((l) => l.mindMap == null);
  console.log(`Found ${lectures.length} of ${all.length} lecture(s) without a mind map.`);

  for (const l of lectures) {
    const tree = buildMindMapFromHtml(l.content, l.titleTa);
    await prisma.lecture.update({
      where: { id: l.id },
      data: { mindMap: tree },
    });
    console.log(`  ✓ ${l.slug} → ${JSON.stringify(tree).length} bytes`);
  }
  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
