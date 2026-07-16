import { runPrompt, withFallback } from "@/lib/llm";
import {
  ResumeRecommendationsSchema,
  type ResumeRecommendationItem,
} from "./schemas";
import {
  heuristicAlignRecommendations,
  type BucketJobLite,
} from "./fallback/align";

// Resume-to-bucket alignment: compare a resume version against the job
// descriptions in one bucket, produce line-level edit recommendations. The
// stored resume changes ONLY when the user accepts an edit.

const MAX_JOBS = 8;
const MAX_DESC_CHARS = 1400;

export async function generateAlignRecommendations(
  resumeContent: string,
  jobs: BucketJobLite[],
  bucketName: string,
): Promise<{ recommendations: ResumeRecommendationItem[]; engine: "llm" | "heuristic" }> {
  const numbered = resumeContent
    .split("\n")
    .map((line, i) => `${i + 1}: ${line}`)
    .join("\n");

  const jobsText = jobs
    .slice(0, MAX_JOBS)
    .map(
      (j, i) =>
        `--- Job ${i + 1}: ${j.title} @ ${j.company}\nSkills asked for: ${j.skills.join(", ")}\n${j.description.slice(0, MAX_DESC_CHARS)}`,
    )
    .join("\n\n");

  const { result, engine } = await withFallback<ResumeRecommendationItem[]>(
    async () => {
      const out = await runPrompt(
        "resume-recommendations",
        { bucketName, resume: numbered, jobs: jobsText },
        ResumeRecommendationsSchema,
      );
      return out.recommendations;
    },
    () => heuristicAlignRecommendations(resumeContent, jobs, bucketName),
  );
  return { recommendations: result, engine };
}

// ---- applying an accepted edit --------------------------------------------

export type ApplyResult =
  | { ok: true; content: string }
  | { ok: false; error: string };

function locateLine(
  lines: string[],
  currentText: string,
  lineNumber: number | null,
): number {
  if (!currentText) return -1;
  // The lineNumber hint wins when the line there still matches — resumes
  // routinely contain duplicate lines, and first-match would edit the wrong
  // occurrence.
  if (lineNumber != null && lineNumber >= 1 && lineNumber <= lines.length) {
    const atHint = lines[lineNumber - 1];
    if (atHint === currentText || atHint.trim() === currentText.trim()) {
      return lineNumber - 1;
    }
  }
  const idx = lines.findIndex((l) => l === currentText);
  if (idx !== -1) return idx;
  // No fuzzy fallback: a near-match means the line was already edited, and
  // silently overwriting it would discard that edit — a clean 409 is safer.
  return lines.findIndex((l) => l.trim() === currentText.trim());
}

/**
 * Apply one accepted recommendation to resume content. Lines are located by
 * exact text (line numbers are only a fallback hint) so previously accepted
 * edits don't invalidate the rest of the queue.
 */
export function applyRecommendationToResume(
  content: string,
  rec: {
    type: string;
    lineNumber: number | null;
    currentText: string;
    suggestedText: string;
  },
): ApplyResult {
  const lines = content.split("\n");

  if (rec.type === "add") {
    if (!rec.currentText) {
      return { ok: true, content: [...lines, rec.suggestedText].join("\n") };
    }
    const idx = locateLine(lines, rec.currentText, rec.lineNumber);
    if (idx === -1) {
      return {
        ok: false,
        error:
          "The anchor line no longer exists in this resume (it may have been edited). Reject this recommendation and re-run the analysis.",
      };
    }
    lines.splice(idx + 1, 0, rec.suggestedText);
    return { ok: true, content: lines.join("\n") };
  }

  const idx = locateLine(lines, rec.currentText, rec.lineNumber);
  if (idx === -1) {
    return {
      ok: false,
      error:
        "The target line no longer matches the resume (it may have been edited since this was generated). Reject this recommendation and re-run the analysis.",
    };
  }

  if (rec.type === "replace") {
    lines[idx] = rec.suggestedText;
  } else if (rec.type === "remove") {
    lines.splice(idx, 1);
  } else {
    return { ok: false, error: `Unknown recommendation type "${rec.type}"` };
  }
  return { ok: true, content: lines.join("\n") };
}
