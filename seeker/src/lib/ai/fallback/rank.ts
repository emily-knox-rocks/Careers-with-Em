import type {
  IjpData,
  JobRank,
  SkillBreakdownItem,
  FitLevelT,
} from "../schemas";
import {
  applyRankCaps,
  type DeterministicDims,
  type JobLike,
  type OverallRank,
} from "../dims";

// Heuristic skills assessment + overall rank, used without an API key.

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9+#. ]/g, " ").replace(/\s+/g, " ").trim();
}

function skillPresent(skill: string, haystacks: string[]): "listed" | "mentioned" | "absent" {
  const needle = normalize(skill);
  if (!needle) return "absent";
  const [listed, description] = haystacks;
  if (listed.includes(needle)) return "listed";
  if (description.includes(needle)) return "mentioned";
  return "absent";
}

export function heuristicRank(
  ijp: IjpData,
  job: JobLike,
  dims: DeterministicDims,
): JobRank {
  const listedSkills = normalize(job.skills.join(" | "));
  const description = normalize(`${job.title} ${job.description}`);

  const breakdown: SkillBreakdownItem[] = ijp.skills.map((skill) => {
    const presence = skillPresent(skill.name, [listedSkills, description]);
    if (presence === "listed") {
      return {
        skill: skill.name,
        level: "strong" as const,
        note: "Listed as a required skill in the posting.",
      };
    }
    if (presence === "mentioned") {
      return {
        skill: skill.name,
        level: "partial" as const,
        note: "Mentioned in the posting text.",
      };
    }
    return {
      skill: skill.name,
      level: "missing" as const,
      note: "Not found in the posting.",
    };
  });

  const musts = ijp.skills.filter((s) => s.priority === "must");
  const mustScores = breakdown
    .filter((b) => musts.some((m) => m.name === b.skill))
    .map((b) => (b.level === "strong" ? 1 : b.level === "partial" ? 0.5 : 0));
  const coverage =
    mustScores.length > 0
      ? mustScores.reduce((a: number, b: number) => a + b, 0) / mustScores.length
      : 0.5;

  const skillsFit: FitLevelT =
    coverage >= 0.6 ? "strong" : coverage >= 0.3 ? "partial" : "weak";
  const matched = breakdown.filter((b) => b.level !== "missing").length;
  const skillsNote = `${matched}/${breakdown.length} profile skills appear in the posting (${Math.round(coverage * 100)}% weighted must-have coverage).`;

  const base: OverallRank =
    skillsFit === "strong" ? "great" : skillsFit === "partial" ? "good" : "okay";
  const overall = applyRankCaps(base, dims, skillsFit);

  const reasons: string[] = [];
  if (dims.dealbreakers.length > 0) {
    reasons.push(`Hits dealbreaker: ${dims.dealbreakers.join("; ")}.`);
  }
  reasons.push(
    skillsFit === "strong"
      ? "Skills line up well with the posting."
      : skillsFit === "partial"
        ? "Partial skills overlap with the posting."
        : "Little skills overlap with the posting.",
  );
  for (const [label, dim] of [
    ["Seniority", dims.seniority],
    ["Compensation", dims.comp],
    ["Location", dims.location],
  ] as const) {
    if (dim.fit !== "strong") reasons.push(`${label}: ${dim.note}`);
  }
  if (reasons.length === 1) {
    reasons.push("Seniority, compensation, and location all check out.");
  }

  return {
    overall,
    justification: reasons.join(" "),
    skillsFit,
    skillsNote,
    skillBreakdown: breakdown,
  };
}
