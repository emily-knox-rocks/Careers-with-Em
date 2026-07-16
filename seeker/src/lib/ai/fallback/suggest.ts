import type { IjpData, IjpSuggestionItem } from "../schemas";

export type FeedbackWithJob = {
  id: string;
  verdict: string;
  reason: string;
  job: {
    title: string;
    company: string;
    remote: string;
    companySize: string | null;
    industry: string | null;
    compMax: number | null;
    skills: string[];
  };
};

// Trend-based suggestion generation without an LLM: look for attributes
// shared by >= 2 same-verdict feedback entries that the IJP doesn't already
// capture. Deliberately conservative — few, defensible suggestions.

export function heuristicSuggestions(
  ijp: IjpData,
  feedback: FeedbackWithJob[],
): IjpSuggestionItem[] {
  const suggestions: IjpSuggestionItem[] = [];
  const yes = feedback.filter((f) => f.verdict === "yes");
  const no = feedback.filter((f) => f.verdict === "no");
  const has = (list: string[], v: string) =>
    list.some((x) => x.trim().toLowerCase() === v.trim().toLowerCase());

  // "no" trend: same company size disliked repeatedly -> drop it from prefs
  for (const size of new Set(no.map((f) => f.job.companySize).filter(Boolean))) {
    const hits = no.filter((f) => f.job.companySize === size);
    if (hits.length >= 2 && has(ijp.companySizePreference, size!)) {
      suggestions.push({
        field: "companySizePreference",
        action: "remove",
        value: size!,
        skillPriority: null,
        rationale: `You said no to ${hits.length} jobs at ${size} companies (${hits.map((h) => h.job.company).join(", ")}).`,
      });
    }
  }

  // "no" trend: non-remote jobs rejected while preference is looser than remote
  if (ijp.remotePreference !== "remote") {
    const nonRemoteNos = no.filter((f) => f.job.remote !== "remote");
    const mentionsLocation = nonRemoteNos.filter((f) =>
      /remote|on-?site|office|commute|location|hybrid/i.test(f.reason),
    );
    if (mentionsLocation.length >= 2) {
      suggestions.push({
        field: "remotePreference",
        action: "set",
        value: "remote",
        skillPriority: null,
        rationale: `${mentionsLocation.length} rejections cited location/office requirements — tightening to remote-only would filter these out.`,
      });
    }
  }

  // "yes" trend: recurring industry not yet in the profile
  for (const industry of new Set(yes.map((f) => f.job.industry).filter(Boolean))) {
    const hits = yes.filter((f) => f.job.industry === industry);
    if (hits.length >= 2 && !has(ijp.industries, industry!)) {
      suggestions.push({
        field: "industries",
        action: "add",
        value: industry!,
        skillPriority: null,
        rationale: `You said yes to ${hits.length} ${industry} jobs (${hits.map((h) => h.job.company).join(", ")}) but ${industry} isn't in your industries.`,
      });
    }
  }

  // "yes" trend: recurring posting skill missing from the profile
  const skillCounts = new Map<string, number>();
  for (const f of yes) {
    for (const s of f.job.skills) {
      const key = s.trim().toLowerCase();
      if (!key || key === "(none detected)") continue;
      skillCounts.set(key, (skillCounts.get(key) ?? 0) + 1);
    }
  }
  const ijpSkillNames = ijp.skills.map((s) => s.name.toLowerCase());
  const topMissing = [...skillCounts.entries()]
    .filter(([skill, count]) => count >= 2 && !ijpSkillNames.includes(skill))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2);
  for (const [skill, count] of topMissing) {
    suggestions.push({
      field: "skills",
      action: "add",
      value: skill.replace(/\b\w/g, (c) => c.toUpperCase()),
      skillPriority: "nice",
      rationale: `${count} jobs you liked ask for "${skill}", which isn't in your skills yet.`,
    });
  }

  return suggestions.slice(0, 5);
}
