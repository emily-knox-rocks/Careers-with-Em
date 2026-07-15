import type { NormalizedJob } from "../schemas";

// Heuristic job-posting normalizer used without an API key. Regex-driven and
// intentionally conservative: unknown -> null/empty rather than guessed.

const SKILL_HINTS = [
  "recruiting", "sourcing", "coaching", "career coaching", "resume writing",
  "interviewing", "talent acquisition", "stakeholder management",
  "program management", "project management", "workshop facilitation",
  "content marketing", "customer success", "onboarding", "account management",
  "salesforce", "hubspot", "linkedin", "ats", "greenhouse", "lever",
  "learning and development", "l&d", "curriculum", "facilitation",
  "communication", "public speaking", "data analysis", "excel", "sql",
  "javascript", "typescript", "react", "python", "product management",
  "figma", "seo", "email marketing", "crm", "analytics", "leadership",
];

function extractComp(text: string): { min: number | null; max: number | null } {
  // $120,000 - $150,000  |  $120k-$150k  |  $120K to $150K
  const range = text.match(
    /\$\s?(\d{2,3})(?:[,.]?(\d{3}))?\s*(k)?\s*(?:-|–|—|to)\s*\$?\s?(\d{2,3})(?:[,.]?(\d{3}))?\s*(k)?/i,
  );
  if (range) {
    const parse = (whole: string, thousands: string | undefined, k: string | undefined) => {
      let n = parseInt(whole + (thousands ?? ""), 10);
      if (k || !thousands) n *= 1000;
      return n >= 20000 && n <= 2000000 ? n : null;
    };
    const min = parse(range[1], range[2], range[3]);
    const max = parse(range[4], range[5], range[6]);
    if (min && max && max >= min) return { min, max };
  }
  const single = text.match(/\$\s?(\d{2,3})(?:[,.]?(\d{3}))?\s*(k)?\b/i);
  if (single) {
    let n = parseInt(single[1] + (single[2] ?? ""), 10);
    if (single[3] || !single[2]) n *= 1000;
    if (n >= 20000 && n <= 2000000) return { min: n, max: n };
  }
  return { min: null, max: null };
}

function extractRemote(text: string): "remote" | "hybrid" | "onsite" {
  const lower = text.toLowerCase();
  if (/hybrid|\d\s*days?\s*(a\s*week\s*)?(in|per)\s*(the\s*)?office/.test(lower)) return "hybrid";
  if (/fully\s*remote|100%\s*remote|remote[- ](first|friendly)|work from anywhere|\bremote\b/.test(lower)) {
    if (/on-?site|in-?office|in person/.test(lower) && !/remote/.test(lower.slice(0, 400))) {
      return "onsite";
    }
    return "remote";
  }
  if (/on-?site|in-?office|in person/.test(lower)) return "onsite";
  return "onsite";
}

function extractSeniority(text: string): string {
  const lower = text.toLowerCase();
  if (/\b(vp|vice president)\b/.test(lower)) return "VP";
  if (/director|head of/.test(lower)) return "Director";
  if (/staff|principal/.test(lower)) return "Staff";
  if (/\blead\b/.test(lower)) return "Lead";
  if (/senior|sr\.?\b/.test(lower)) return "Senior";
  if (/junior|entry|associate|intern/.test(lower)) return "Junior";
  if (/manager/.test(lower)) return "Manager";
  return "Mid-level";
}

function extractLocation(text: string): string {
  if (/remote\s*\(?(us|usa|united states)?\)?/i.test(text.slice(0, 600)) && extractRemote(text) === "remote") {
    return "Remote (US)";
  }
  const m = text.match(/\b([A-Z][a-zA-Z]+(?: [A-Z][a-zA-Z]+)?),\s*([A-Z]{2})\b/);
  return m ? `${m[1]}, ${m[2]}` : "";
}

export function heuristicNormalizeJob(raw: string): NormalizedJob {
  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const firstLine = lines[0] ?? "Untitled role";
  // "Senior Recruiter at Acme" or "Senior Recruiter — Acme"
  const titleMatch = firstLine.match(/^(.{3,80}?)\s+(?:at|@|—|–|\|)\s+(.{2,60})$/);
  const title = (titleMatch ? titleMatch[1] : firstLine).slice(0, 120);
  let company = titleMatch ? titleMatch[2].trim() : "";
  if (!company) {
    const aboutMatch = raw.match(/about\s+([A-Z][A-Za-z0-9&. ]{2,40})\b/);
    company = aboutMatch ? aboutMatch[1].trim() : "Unknown";
  }

  const comp = extractComp(raw);
  const lower = raw.toLowerCase();
  const skills = SKILL_HINTS.filter((s) => lower.includes(s)).slice(0, 12);

  return {
    title,
    company,
    location: extractLocation(raw),
    remote: extractRemote(raw),
    seniority: extractSeniority(title),
    compMin: comp.min,
    compMax: comp.max === comp.min && comp.min != null ? null : comp.max,
    compCurrency: "USD",
    companySize: null,
    industry: null,
    skills: skills.length > 0 ? skills : ["(none detected)"],
    description: raw.trim(),
  };
}
