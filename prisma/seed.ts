import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function htmlToText(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const sampleContent = `
<p>இந்த சொற்பொழிவில், ஈமானின் அடிப்படைகளை நாம் ஆராய்கிறோம். ஈமான் என்பது வெறும் நம்பிக்கை மட்டுமல்ல; அது உள்ளத்தின் உறுதியும், நாவின் ஒப்புதலும், உறுப்புகளின் செயலும் ஆகும்.</p>
<h2>ஈமானின் ஆறு கூறுகள்</h2>
<p>அல்லாஹ்வின் மீதும், அவனுடைய மலக்குகள் மீதும், வேதங்கள் மீதும், தூதர்கள் மீதும், இறுதி நாள் மீதும், விதியின் மீதும் நம்பிக்கை கொள்வது ஈமானின் அடிப்படைக் கூறுகளாகும்.</p>
<p>ஒவ்வொரு கூறும் நம் வாழ்வில் எவ்வாறு பிரதிபலிக்கிறது என்பதை நாம் சிந்திக்க வேண்டும். அறிவு செயலாக மாறும்போதே அது பயனளிக்கிறது.</p>
<h3>தவ்ஹீதின் முக்கியத்துவம்</h3>
<p>தவ்ஹீத் என்பது அல்லாஹ்வை ஒருமைப்படுத்துதல். வணக்கம் அனைத்தும் அவனுக்கே உரியது. இதுவே நம் வாழ்வின் மையம்.</p>
<p>இந்த கொள்கையை உள்வாங்கிக் கொள்ளும்போது, நம் செயல்கள் அனைத்தும் ஒரு நோக்கத்தை நோக்கி அமைகின்றன. நிச்சயமாக, நல்லறம் இறைவனை நெருங்கும் வழியாகும்.</p>
<p>முடிவாக, அறிவைப் பெறுவது ஒவ்வொரு முஃமினின் கடமை. கற்றதை பிறருக்கும் சொல்லித் தருவது இரட்டிப்பு நன்மை.</p>
`;

const sampleContent2 = `
<p>பொறுமை (ஸப்ர்) என்பது இஸ்லாத்தின் உயரிய பண்புகளில் ஒன்று. இன்னல்களின் போது நிலைத்திருப்பதும், கடமைகளில் உறுதியாக இருப்பதும், தவறுகளிலிருந்து விலகி இருப்பதும் பொறுமையின் வடிவங்களாகும்.</p>
<h2>பொறுமையின் வகைகள்</h2>
<p>வணக்கங்களில் பொறுமை, பாவங்களைத் தவிர்ப்பதில் பொறுமை, விதியின் சோதனைகளில் பொறுமை — இவை மூன்றும் முஃமினின் வாழ்வை அழகுபடுத்துகின்றன.</p>
<h3>நன்றியும் பொறுமையும்</h3>
<p>சுகத்தில் நன்றியும், துன்பத்தில் பொறுமையும் கொள்வது விசுவாசியின் இயல்பு. இவ்விரண்டும் இணையும்போது வாழ்வில் அமைதி நிலைக்கிறது.</p>
<p>நாம் ஒவ்வொரு நாளும் சிறு சோதனைகளைச் சந்திக்கிறோம். அவற்றை எவ்வாறு எதிர்கொள்கிறோம் என்பதே நம் ஈமானின் அளவுகோல்.</p>
`;

async function main() {
  console.log("🌱 Seeding…");

  // ── Quran verses ──────────────────────────────────────────────────────────
  const v1 = await prisma.quranVerse.upsert({
    where: { surahName_verseNumber: { surahName: "Al-Ikhlas", verseNumber: 1 } },
    update: {},
    create: {
      surahName: "Al-Ikhlas",
      surahNumber: 112,
      verseNumber: 1,
      arabicText: "قُلْ هُوَ اللَّهُ أَحَدٌ",
      tamilText: "(நபியே!) கூறுவீராக: அவன் அல்லாஹ் ஒருவனே.",
    },
  });
  const v2 = await prisma.quranVerse.upsert({
    where: { surahName_verseNumber: { surahName: "Al-Asr", verseNumber: 3 } },
    update: {},
    create: {
      surahName: "Al-Asr",
      surahNumber: 103,
      verseNumber: 3,
      arabicText:
        "إِلَّا الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ وَتَوَاصَوْا بِالْحَقِّ وَتَوَاصَوْا بِالصَّبْرِ",
      tamilText:
        "ஆயினும், விசுவாசம் கொண்டு நற்செயல்கள் புரிந்து, சத்தியத்தைக் கொண்டும் பொறுமையைக் கொண்டும் ஒருவருக்கொருவர் உபதேசம் செய்தவர்களைத் தவிர.",
    },
  });

  // ── Admin user (so the dashboard works before any real Google login) ────────
  const adminEmail = (process.env.ADMIN_EMAILS ?? "founder@example.org")
    .split(",")[0]
    .trim();
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: "ADMIN" },
    create: { email: adminEmail, name: "NPO Admin", role: "ADMIN" },
  });

  // ── Lectures ────────────────────────────────────────────────────────────────
  const lecture1 = await prisma.lecture.upsert({
    where: { slug: "iman-foundations" },
    update: {},
    create: {
      slug: "iman-foundations",
      titleTa: "ஈமானின் அடிப்படைகள்",
      titleEn: "The Foundations of Iman",
      summary: "ஈமான் என்றால் என்ன? அதன் ஆறு கூறுகளும், அவை நம் வாழ்வில் எவ்வாறு பிரதிபலிக்கின்றன என்பதையும் ஆராய்வோம்.",
      content: sampleContent,
      contentText: htmlToText(sampleContent),
      status: "PUBLISHED",
      featured: true,
      readTime: 6,
      publishedAt: new Date(),
      authorId: admin.id,
      verses: { create: [{ verseId: v1.id, order: 0 }] },
    },
  });

  const lecture2 = await prisma.lecture.upsert({
    where: { slug: "patience-and-gratitude" },
    update: {},
    create: {
      slug: "patience-and-gratitude",
      titleTa: "பொறுமையும் நன்றியும்",
      titleEn: "Patience and Gratitude",
      summary: "பொறுமையின் வகைகளும், நன்றியுடன் இணையும்போது வாழ்வில் ஏற்படும் அமைதியையும் பற்றிய சொற்பொழிவு.",
      content: sampleContent2,
      contentText: htmlToText(sampleContent2),
      status: "PUBLISHED",
      readTime: 5,
      publishedAt: new Date(Date.now() - 86400000),
      authorId: admin.id,
      verses: { create: [{ verseId: v2.id, order: 0 }] },
    },
  });

  // ── Quiz for lecture 1 ────────────────────────────────────────────────────
  await prisma.quiz.upsert({
    where: { lectureId: lecture1.id },
    update: {},
    create: {
      lectureId: lecture1.id,
      title: "Test Your Understanding",
      questions: {
        create: [
          {
            order: 0,
            text: "ஈமானின் கூறுகள் எத்தனை?",
            options: ["நான்கு", "ஐந்து", "ஆறு", "ஏழு"],
            correct: 2,
            explanation: "ஈமானுக்கு ஆறு அடிப்படைக் கூறுகள் உள்ளன.",
          },
          {
            order: 1,
            text: "தவ்ஹீத் என்பதன் பொருள் என்ன?",
            options: [
              "அல்லாஹ்வை ஒருமைப்படுத்துதல்",
              "தொழுகை",
              "நோன்பு",
              "ஹஜ்",
            ],
            correct: 0,
            explanation: "தவ்ஹீத் = அல்லாஹ்வை ஒருமைப்படுத்துதல்.",
          },
          {
            order: 2,
            text: "அறிவு எப்போது பயனளிக்கிறது?",
            options: ["படிக்கும்போது", "செயலாக மாறும்போது", "பேசும்போது", "எழுதும்போது"],
            correct: 1,
            explanation: "அறிவு செயலாக மாறும்போதே அது பயனளிக்கிறது.",
          },
        ],
      },
    },
  });

  // ── Install the full-text-search trigger + backfill ─────────────────────────
  // Run as discrete statements. We can't split fts.sql on ";" because the
  // function body is dollar-quoted ($$ … $$) and contains semicolons, and
  // Prisma's $executeRawUnsafe runs exactly one statement per call.
  const ftsStatements = [
    `CREATE OR REPLACE FUNCTION lecture_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW."searchVector" :=
    setweight(to_tsvector('simple', coalesce(NEW."titleTa", '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW."titleEn", '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW."summary", '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(NEW."contentText", '')), 'C');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;`,
    `DROP TRIGGER IF EXISTS lecture_search_vector_trigger ON "Lecture";`,
    `CREATE TRIGGER lecture_search_vector_trigger
  BEFORE INSERT OR UPDATE OF "titleTa", "titleEn", "summary", "contentText"
  ON "Lecture"
  FOR EACH ROW
  EXECUTE FUNCTION lecture_search_vector_update();`,
    // Backfill searchVector for the rows seeded above (trigger fires on UPDATE).
    `UPDATE "Lecture" SET "contentText" = "contentText";`,
  ];
  for (const stmt of ftsStatements) {
    await prisma.$executeRawUnsafe(stmt);
  }

  // ── A few analytics events so the dashboard isn't empty ─────────────────────
  await prisma.event.createMany({
    data: [
      { type: "lecture_opened", lectureId: lecture1.id, userId: admin.id },
      { type: "scroll_50", lectureId: lecture1.id, userId: admin.id },
      { type: "lecture_completed", lectureId: lecture1.id, userId: admin.id },
      { type: "lecture_opened", lectureId: lecture2.id, userId: admin.id },
    ],
  });

  console.log("✅ Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
