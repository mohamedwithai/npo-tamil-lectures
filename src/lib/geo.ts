import "server-only";
import { headers } from "next/headers";

// Coarse, IP-derived visitor location read from the hosting platform's geo
// headers. We only ever keep country + region (no precise location). Returns
// nulls when no geo header is present (e.g. local dev, or an unknown host).
export type RequestGeo = {
  country: string | null; // ISO 3166-1 alpha-2, uppercase
  region: string | null; // subdivision code/name
  city: string | null; // resolved but intentionally not persisted
};

const EMPTY: RequestGeo = { country: null, region: null, city: null };

function norm(v: string | null | undefined): string | null {
  const s = (v ?? "").trim();
  return s ? s : null;
}

export async function getRequestGeo(): Promise<RequestGeo> {
  try {
    const h = await headers();

    // Netlify — `x-nf-geo` is base64-encoded JSON.
    const nf = h.get("x-nf-geo");
    if (nf) {
      try {
        const j = JSON.parse(Buffer.from(nf, "base64").toString("utf8")) as {
          country?: { code?: string };
          subdivision?: { code?: string; name?: string };
          city?: string;
        };
        return {
          country: norm(j.country?.code)?.toUpperCase() ?? null,
          region: norm(j.subdivision?.code ?? j.subdivision?.name),
          city: norm(j.city),
        };
      } catch {
        // fall through to header-based detection
      }
    }

    // Vercel
    const vCountry = norm(h.get("x-vercel-ip-country"));
    if (vCountry) {
      const rawCity = norm(h.get("x-vercel-ip-city"));
      return {
        country: vCountry.toUpperCase(),
        region: norm(h.get("x-vercel-ip-country-region")),
        city: rawCity ? safeDecode(rawCity) : null,
      };
    }

    // Cloudflare (XX = unknown)
    const cf = norm(h.get("cf-ipcountry"));
    if (cf && cf.toUpperCase() !== "XX") {
      return { country: cf.toUpperCase(), region: null, city: null };
    }

    // Generic fallbacks (some proxies/CDNs)
    const generic = norm(h.get("x-country")) ?? norm(h.get("x-geo-country"));
    if (generic) return { country: generic.toUpperCase(), region: null, city: null };

    return EMPTY;
  } catch {
    return EMPTY;
  }
}

function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}
