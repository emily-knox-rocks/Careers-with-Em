import type { IjpData } from "../schemas";
import type { IjpIntake } from "../ijp";

// Deterministic IJP draft used when no ANTHROPIC_API_KEY is configured.
// Structured intake answers map straight onto fields; skills/industries are
// extracted from the resume against a lexicon.

const SKILL_LEXICON = [
  // engineering
  "javascript", "typescript", "react", "next.js", "node.js", "python", "java",
  "go", "rust", "sql", "postgres", "mysql", "aws", "gcp", "azure", "docker",
  "kubernetes", "terraform", "graphql", "rest apis", "ci/cd", "testing",
  "system design", "machine learning", "data engineering", "etl",
  // product / project
  "product management", "product strategy", "roadmap", "user research",
  "a/b testing", "agile", "scrum", "stakeholder management", "okrs",
  "go-to-market", "product analytics", "prioritization", "discovery",
  // data
  "data analysis", "excel", "tableau", "looker", "power bi", "dbt",
  "statistics", "experimentation", "dashboards",
  // design
  "figma", "ux design", "ui design", "design systems", "prototyping",
  "usability testing", "interaction design",
  // marketing / growth
  "seo", "content marketing", "email marketing", "paid acquisition",
  "growth marketing", "brand", "copywriting", "social media", "crm",
  "marketing automation", "lifecycle marketing",
  // sales / cs
  "b2b sales", "saas sales", "account management", "customer success",
  "pipeline management", "negotiation", "salesforce", "hubspot",
  "onboarding", "renewals", "upselling",
  // recruiting / people / coaching
  "recruiting", "sourcing", "talent acquisition", "interviewing", "coaching",
  "career coaching", "resume writing", "linkedin", "hiring", "onboarding programs",
  // general leadership
  "leadership", "team management", "mentoring", "cross-functional collaboration",
  "communication", "public speaking", "workshop facilitation", "budgeting",
  "operations", "process improvement", "project management", "analytics",
];

const INDUSTRY_LEXICON = [
  "saas", "fintech", "healthcare", "healthtech", "edtech", "e-commerce",
  "retail", "consumer", "enterprise software", "developer tools", "ai",
  "biotech", "climate", "energy", "media", "gaming", "hospitality",
  "logistics", "manufacturing", "nonprofit", "government", "hr tech",
  "recruiting", "marketplaces", "cybersecurity", "insurance", "real estate",
  "travel", "consulting", "agency", "education", "coaching",
];

function extractByLexicon(text: string, lexicon: string[]): string[] {
  const lower = text.toLowerCase();
  const hits: { term: string; count: number }[] = [];
  for (const term of lexicon) {
    // count occurrences of the term as a rough relevance signal
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const matches = lower.match(new RegExp(`\\b${escaped}\\b`, "g"));
    if (matches && matches.length > 0) {
      hits.push({ term, count: matches.length });
    }
  }
  hits.sort((a, b) => b.count - a.count);
  return hits.map((h) => h.term);
}

function splitList(value: string): string[] {
  return value
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

// Locations often contain commas ("Denver, CO"), so only split on
// semicolons and newlines.
function splitLocations(value: string): string[] {
  return value
    .split(/[;\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function titleCase(s: string): string {
  return s
    .split(" ")
    .map((w) => (w.length > 2 ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

export function heuristicIjpDraft(resume: string, intake: IjpIntake): IjpData {
  const skillTerms = extractByLexicon(resume, SKILL_LEXICON).slice(0, 12);
  const industries = extractByLexicon(resume, INDUSTRY_LEXICON)
    .slice(0, 4)
    .map(titleCase);

  const compFloor = intake.compensationFloor
    ? parseInt(intake.compensationFloor.replace(/[^0-9]/g, ""), 10)
    : NaN;

  return {
    targetRoles: splitList(intake.targetRoles).map(titleCase),
    industries:
      intake.industries.trim().length > 0
        ? splitList(intake.industries).map(titleCase)
        : industries,
    seniority: intake.seniority.trim(),
    locations: splitLocations(intake.locations).map(titleCase),
    remotePreference: intake.remotePreference,
    compensationFloor: Number.isFinite(compFloor) ? compFloor : null,
    compensationCurrency: "USD",
    companySizePreference: intake.companySizePreference,
    dealbreakers: splitList(intake.dealbreakers),
    skills: skillTerms.map((name, i) => ({
      name: titleCase(name),
      priority: i < 6 ? ("must" as const) : ("nice" as const),
    })),
    notes:
      "Drafted without LLM assistance (heuristic keyword extraction) — review the skills list especially.",
  };
}
