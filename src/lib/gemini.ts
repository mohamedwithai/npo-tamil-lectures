import "server-only";
import {
  buildMindMapFromHtml,
  normalizeMindMap,
  countNodes,
  type MindMapNode,
} from "@/lib/mindmap";
import { htmlToText } from "@/lib/utils";

// Free-tier Gemini model. Flash is fast, multilingual (good Tamil), and has a
// generous free quota via an AI Studio key (https://aistudio.google.com/apikey).
const MODEL = "gemini-2.0-flash";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const MAX_CONTENT_CHARS = 6000; // keep requests small + fast within free quota
const TIMEOUT_MS = 20_000;

function buildPrompt(title: string, contentText: string): string {
  return `You are generating a mind map (like Google NotebookLM) from a lecture.

Return ONLY a JSON object, no markdown fences, with this exact shape:
{ "label": string, "children": [ { "label": string, "children": [ ... ] } ] }

Rules:
- The root "label" is the lecture's main topic (use the title).
- Create 3 to 7 main branches for the core themes.
- Each main branch has 2 to 5 child nodes capturing key concepts or points.
- Maximum depth is 3 levels below the root.
- Labels must be SHORT (2 to 6 words), in the SAME language as the lecture (Tamil if the content is Tamil).
- Capture the actual ideas in the lecture; do not invent unrelated content.

Lecture title: ${title}

Lecture content:
${contentText.slice(0, MAX_CONTENT_CHARS)}`;
}

/** Strip ```json fences and isolate the first {...} block from a model reply. */
function extractJson(raw: string): string {
  let s = raw.trim();
  s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  return start !== -1 && end > start ? s.slice(start, end + 1) : s;
}

/** Call Gemini to produce a mind-map tree. Returns null on any failure. */
async function generateWithGemini(
  title: string,
  contentText: string
): Promise<MindMapNode | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${ENDPOINT}?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(title, contentText) }] }],
        generationConfig: {
          temperature: 0.4,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!res.ok) {
      console.warn(`[gemini] mind map request failed: ${res.status}`);
      return null;
    }

    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;

    const parsed = JSON.parse(extractJson(text)) as unknown;
    const tree = normalizeMindMap(parsed);
    // Require a non-trivial tree, else fall back to headings.
    return tree && countNodes(tree) >= 3 ? tree : null;
  } catch (e) {
    console.warn("[gemini] mind map generation error:", (e as Error).message);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Generate a mind map for a lecture. Tries Gemini first (true NotebookLM-style
 * concept extraction); on any failure falls back to the deterministic
 * heading-based generator so the result is never empty.
 */
export async function generateMindMap(
  titleTa: string,
  contentHtml: string,
  titleEn?: string | null
): Promise<MindMapNode> {
  const title = [titleTa, titleEn].filter(Boolean).join(" / ");
  const contentText = htmlToText(contentHtml);

  const ai = await generateWithGemini(title, contentText);
  if (ai) return ai;

  return buildMindMapFromHtml(contentHtml, titleTa);
}
