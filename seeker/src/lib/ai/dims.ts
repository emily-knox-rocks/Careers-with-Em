import type { IjpData, FitLevelT } from "./schemas";

// Deterministic per-dimension scoring for the structured fields. These are
// computed in code in BOTH engine modes — the LLM only adds judgment on
// skills fit and the overall justification.

export type JobLike = {
  title: string;
  company: string;
  location: string;
  remote: string;
  seniority: string;
  compMin: number | null;
  compMax: number | null;
  companySize: string | null;
  industry: string | null;
  skills: string[];
  description: string;
};

export type DimScore = { fit: FitLevelT; note: string };

export type DeterministicDims = {
  seniority: DimScore;
  comp: DimScore;
  location: DimScore;
  dealbreakers: string[]; // violated dealbreaker phrases
};

const LEVELS: [RegExp, number][] = [
  [/intern|entry|junior|associate/i, 1],
  [/\bmid\b|mid-level|intermediate/i, 2],
  [/senior|sr\.?\b/i, 3],
  [/staff|principal|lead\b/i, 4],
  [/director|head of/i, 5],
  [/\bvp\b|vice president|chief|c-level|cxo/i, 6],
];

function seniorityLevel(text: string): number | null {
  for (const [re, level] of LEVELS) {
    if (re.test(text)) return level;
  }
  if (/manager/i.test(text)) return 3;
  return null;
}

function scoreSeniority(ijp: IjpData, job: JobLike): DimScore {
  const want = seniorityLevel(ijp.seniority);
  const have = seniorityLevel(`${job.seniority} ${job.title}`);
  if (want == null || have == null) {
    return { fit: "partial", note: "Seniority could not be compared reliably." };
  }
  const diff = Math.abs(want - have);
  if (diff === 0) {
    return { fit: "strong", note: `Level matches your "${ijp.seniority}" target.` };
  }
  if (diff === 1) {
    return {
      fit: "partial",
      note: `${job.seniority || job.title} is one level ${have > want ? "above" : "below"} your target.`,
    };
  }
  return {
    fit: "weak",
    note: `${job.seniority || job.title} is far from your "${ijp.seniority}" target.`,
  };
}

function scoreComp(ijp: IjpData, job: JobLike): DimScore {
  const floor = ijp.compensationFloor;
  if (!floor) {
    return { fit: "strong", note: "No compensation floor set in your profile." };
  }
  const best = job.compMax ?? job.compMin;
  if (best == null) {
    return { fit: "partial", note: "Posting does not state compensation." };
  }
  if (best >= floor) {
    return {
      fit: "strong",
      note: `Top of range ($${best.toLocaleString()}) meets your $${floor.toLocaleString()} floor.`,
    };
  }
  if (best >= floor * 0.9) {
    return {
      fit: "partial",
      note: `Top of range ($${best.toLocaleString()}) is just under your $${floor.toLocaleString()} floor.`,
    };
  }
  return {
    fit: "weak",
    note: `Top of range ($${best.toLocaleString()}) is well below your $${floor.toLocaleString()} floor.`,
  };
}

function cityMatches(ijp: IjpData, jobLocation: string): boolean {
  const loc = jobLocation.toLowerCase();
  return ijp.locations.some((l) => {
    const city = l.split(",")[0].trim().toLowerCase();
    return city.length > 0 && loc.includes(city);
  });
}

function scoreLocation(ijp: IjpData, job: JobLike): DimScore {
  const jobRemote = job.remote as "remote" | "hybrid" | "onsite";
  const inCity = cityMatches(ijp, job.location);
  const noCityPref = ijp.locations.length === 0;

  switch (ijp.remotePreference) {
    case "remote":
      if (jobRemote === "remote")
        return { fit: "strong", note: "Fully remote, matching your preference." };
      if (jobRemote === "hybrid" && (inCity || noCityPref))
        return { fit: "partial", note: `Hybrid in ${job.location} — you prefer fully remote.` };
      return { fit: "weak", note: `${jobRemote} in ${job.location} — you prefer fully remote.` };
    case "hybrid":
      if (jobRemote === "hybrid" && (inCity || noCityPref))
        return { fit: "strong", note: `Hybrid in ${job.location}, matching your preference.` };
      if (jobRemote === "remote")
        return { fit: "strong", note: "Fully remote — compatible with a hybrid preference." };
      if (jobRemote === "onsite" && inCity)
        return { fit: "partial", note: `On-site in ${job.location} — you prefer hybrid.` };
      return { fit: "weak", note: `${jobRemote} in ${job.location} doesn't fit your hybrid preference.` };
    case "onsite":
      if (jobRemote !== "remote" && inCity)
        return { fit: "strong", note: `In-office in ${job.location}, matching your preference.` };
      if (jobRemote === "remote")
        return { fit: "partial", note: "Fully remote — you prefer being on-site." };
      return { fit: "weak", note: `Located in ${job.location}, outside your locations.` };
    case "flexible":
    default:
      if (jobRemote === "remote" || inCity || noCityPref)
        return { fit: "strong", note: "Compatible with your flexible location preference." };
      return {
        fit: "partial",
        note: `${jobRemote} in ${job.location} — outside your listed locations.`,
      };
  }
}

const DEALBREAKER_STOPWORDS = new Set([
  "roles", "role", "jobs", "job", "companies", "company", "work", "working",
  "only", "fully", "pay", "positions", "position", "no", "not", "without",
]);

/**
 * Best-effort dealbreaker detection for the heuristic engine: strip the
 * leading negation, then look for distinctive tokens of the dealbreaker
 * phrase in the posting. The LLM engine handles nuance properly; this exists
 * so fallback mode still catches the obvious cases.
 */
function violatedDealbreakers(ijp: IjpData, job: JobLike): string[] {
  const text = `${job.title} ${job.description}`.toLowerCase();
  const violated: string[] = [];
  for (const db of ijp.dealbreakers) {
    const phrase = db.toLowerCase().replace(/^(no|not|avoid|never)\s+/, "");
    // special-case: on-site dealbreakers match the structured remote field
    if (/on-?site|in-?office/.test(phrase) && job.remote === "onsite") {
      violated.push(db);
      continue;
    }
    const tokens = phrase
      .split(/[\s/]+/)
      .flatMap((t) => t.split("-"))
      .map((t) => t.replace(/[^a-z0-9%]/g, ""))
      .filter(
        (t) =>
          (t.length >= 5 || /[\d%]/.test(t)) && !DEALBREAKER_STOPWORDS.has(t),
      );
    // Require EVERY distinctive token so "no 100% travel" doesn't fire on a
    // posting that merely mentions occasional travel.
    if (tokens.length > 0 && tokens.every((t) => text.includes(t))) {
      violated.push(db);
    }
  }
  return violated;
}

export function scoreDeterministicDims(
  ijp: IjpData,
  job: JobLike,
): DeterministicDims {
  return {
    seniority: scoreSeniority(ijp, job),
    comp: scoreComp(ijp, job),
    location: scoreLocation(ijp, job),
    dealbreakers: violatedDealbreakers(ijp, job),
  };
}

const RANK_ORDER = ["poor", "okay", "good", "great"] as const;
export type OverallRank = (typeof RANK_ORDER)[number];

export function capRank(rank: OverallRank, cap: OverallRank): OverallRank {
  return RANK_ORDER.indexOf(rank) > RANK_ORDER.indexOf(cap) ? cap : rank;
}

/**
 * Shared rank rubric: start from skills fit, then cap by the weakest
 * deterministic dimensions and dealbreakers. Applied verbatim in heuristic
 * mode and as a guardrail on top of LLM output.
 */
export function applyRankCaps(
  base: OverallRank,
  dims: DeterministicDims,
  skillsFit: FitLevelT,
): OverallRank {
  let rank = base;
  if (skillsFit === "weak") rank = capRank(rank, "okay");
  for (const dim of [dims.seniority, dims.comp, dims.location]) {
    if (dim.fit === "weak") rank = capRank(rank, "okay");
    else if (dim.fit === "partial") rank = capRank(rank, "good");
  }
  if (dims.dealbreakers.length > 0) rank = capRank(rank, "poor");
  return rank;
}
