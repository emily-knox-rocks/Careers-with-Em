import type { JobPost } from "@prisma/client";
import { runPrompt, withFallback } from "@/lib/llm";
import { parseJson, toJson } from "@/lib/jsonField";
import { JobRankSchema, type IjpData, type JobRank } from "./schemas";
import {
  applyRankCaps,
  scoreDeterministicDims,
  type DeterministicDims,
  type JobLike,
  type OverallRank,
} from "./dims";
import { heuristicRank } from "./fallback/rank";

export function jobRowToJobLike(job: JobPost): JobLike {
  return {
    title: job.title,
    company: job.company,
    location: job.location,
    remote: job.remote,
    seniority: job.seniority,
    compMin: job.compMin,
    compMax: job.compMax,
    companySize: job.companySize,
    industry: job.industry,
    skills: parseJson<string[]>(job.skills, []),
    description: job.description,
  };
}

function dimsForPrompt(dims: DeterministicDims): string {
  return JSON.stringify(
    {
      seniority: dims.seniority,
      compensation: dims.comp,
      location: dims.location,
      dealbreakersViolated: dims.dealbreakers,
    },
    null,
    2,
  );
}

/**
 * Score one job against the IJP. Deterministic dims are always computed in
 * code; the skills assessment + justification come from the LLM when
 * available, otherwise from the keyword heuristic. Rank caps are enforced in
 * code in both modes so the rubric can't drift.
 */
export async function rankJob(ijp: IjpData, job: JobLike) {
  const dims = scoreDeterministicDims(ijp, job);

  const { result, engine } = await withFallback<JobRank>(
    async () => {
      const llmRank = await runPrompt(
        "job-rank",
        {
          ijp: JSON.stringify(ijp, null, 2),
          job: JSON.stringify(job, null, 2),
          dimensions: dimsForPrompt(dims),
        },
        JobRankSchema,
      );
      return {
        ...llmRank,
        overall: applyRankCaps(
          llmRank.overall as OverallRank,
          dims,
          llmRank.skillsFit,
        ),
      };
    },
    () => heuristicRank(ijp, job, dims),
  );

  return {
    overall: result.overall,
    justification: result.justification,
    skillsFit: result.skillsFit,
    skillsNote: result.skillsNote,
    seniorityFit: dims.seniority.fit,
    seniorityNote: dims.seniority.note,
    compFit: dims.comp.fit,
    compNote: dims.comp.note,
    locationFit: dims.location.fit,
    locationNote: dims.location.note,
    skillBreakdown: toJson(result.skillBreakdown),
    engine,
  };
}
