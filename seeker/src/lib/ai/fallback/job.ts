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

// Salary amounts only multiply by 1000 when a "k" suffix says so — otherwise
// "$500 home office stipend" becomes a $500,000 salary.
function extractComp(text: string): { min: number | null; max: number | null } {
  const inRange = (n: number) => n >= 20000 && n <= 2000000;
  const range = text.match(
    /\$\s?(\d{2,3})(?:[,.]?(\d{3}))?\s*(k)?\s*(?:-|–|—|to)\s*\$?\s?(\d{2,3})(?:[,.]?(\d{3}))?\s*(k)?/i,
  );
  if (range) {
    // "$120-140k" carries the k on one side only — it applies to both
    const kEither = Boolean(range[3] || range[6]);
    const parse = (whole: string, thousands: string | undefined) => {
      let n = parseInt(whole + (thousands ?? ""), 10);
      if (kEither && !thousands) n *= 1000;
      return inRange(n) ? n : null;
    };
    const min = parse(range[1], range[2]);
    const max = parse(range[4], range[5]);
    if (min && max && max >= min) return { min, max };
  }
  const single = text.match(/\$\s?(\d{2,3})(?:[,.]?(\d{3}))?\s*(k)\b/i);
  if (single) {
    const n = parseInt(single[1] + (single[2] ?? ""), 10) * (single[2] ? 1 : 1000);
    if (inRange(n)) return { min: n, max: n };
  }
  const plain = text.match(/\$\s?(\d{2,3})[,.](\d{3})\b/);
  if (plain) {
    const n = parseInt(plain[1] + plain[2], 10);
    if (inRange(n)) return { min: n, max: n };
  }
  return { min: null, max: null };
}

function extractRemote(text: string): "remote" | "hybrid" | "onsite" {
  const lower = text.toLowerCase();
  // negated remote ("Remote: No", "remote work is not available") wins first
  if (
    /remote:\s*no\b|remote work is not|not (a )?remote|no remote/.test(lower)
  ) {
    return /hybrid/.test(lower) ? "hybrid" : "onsite";
  }
  if (/hybrid|\d\s*days?\s*(a\s*week\s*)?(in|per)\s*(the\s*)?office/.test(lower)) return "hybrid";
  if (/fully\s*remote|100%\s*remote|remote[- ](first|friendly)|work from anywhere|\bremote\b/.test(lower)) {
    return "remote";
  }
  if (/on-?site|in-?office|in person/.test(lower)) return "onsite";
  return "onsite";
}

function extractSeniority(text: string): string {
  const lower = text.toLowerCase();
  if (/\b(vp|vice president)\b/.test(lower)) return "VP";
  if (/\bdirector\b|head of/.test(lower)) return "Director";
  if (/\bstaff\b|\bprincipal\b/.test(lower)) return "Staff";
  if (/\bsenior\b|\bsr\.?\b/.test(lower)) return "Senior";
  if (/\blead\b(?!\s+gen)/.test(lower)) return "Lead";
  if (/\bjunior\b|\bentry\b|\bassociate\b|\bintern(ship)?\b/.test(lower)) return "Junior";
  if (/manager/.test(lower)) return "Manager";
  return "Mid-level";
}

const US_STATES = new Set([
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
]);

function extractLocation(text: string): string {
  if (/remote\s*\(?(us|usa|united states)?\)?/i.test(text.slice(0, 600)) && extractRemote(text) === "remote") {
    return "Remote (US)";
  }
  // require a real state code so "Marketing, IT" doesn't read as a city
  const re = /\b([A-Z][a-zA-Z]+(?: [A-Z][a-zA-Z]+)?),\s*([A-Z]{2})\b/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (US_STATES.has(m[2])) return `${m[1]}, ${m[2]}`;
  }
  return "";
}

export function heuristicNormalizeJob(raw: string): NormalizedJob {
  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const firstLine = lines[0] ?? "Untitled role";
  // "Senior Recruiter at Acme" / "Senior Recruiter — Acme" / "Senior Recruiter - Acme"
  const titleMatch = firstLine.match(
    /^(.{3,80}?)\s+(?:at|@|—|–|\||-)\s+(.{2,60})$/,
  );
  const title = (titleMatch ? titleMatch[1] : firstLine).slice(0, 120);
  let company = titleMatch ? titleMatch[2].trim() : "";
  if (!company) {
    // an "About Acme" section header on its own line
    const aboutMatch = raw.match(/^about\s+([A-Z][A-Za-z0-9&.\- ]{1,40})\s*$/im);
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
