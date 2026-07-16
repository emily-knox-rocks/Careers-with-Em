import { prisma } from "@/lib/prisma";
import { runPrompt, withFallback } from "@/lib/llm";
import { parseJson, toJson } from "@/lib/jsonField";
import {
  IjpSuggestionsSchema,
  type IjpData,
  type IjpSuggestionItem,
} from "./schemas";
import { ijpRowToData } from "./ijp";
import {
  heuristicSuggestions,
  type FeedbackWithJob,
} from "./fallback/suggest";

// The Metaview loop, mirrored: yes/maybe/no feedback accumulates, the agent
// reads the trends and proposes IJP updates, the user confirms each one.

export async function generateIjpSuggestions(userId: string): Promise<{
  created: number;
  engine: "llm" | "heuristic";
  consumed: number;
}> {
  const ijpRow = await prisma.idealJobProfile.findUnique({ where: { userId } });
  if (!ijpRow) throw new Error("Create your IJP first.");
  const ijp: IjpData = ijpRowToData(ijpRow);

  const feedbackRows = await prisma.jobFeedback.findMany({
    where: { consumedAt: null, jobPost: { userId } },
    include: { jobPost: true },
    orderBy: { createdAt: "asc" },
  });
  if (feedbackRows.length === 0) {
    throw new Error("No new feedback since the last suggestion run.");
  }

  const feedback: FeedbackWithJob[] = feedbackRows.map((f) => ({
    id: f.id,
    verdict: f.verdict,
    reason: f.reason,
    job: {
      title: f.jobPost.title,
      company: f.jobPost.company,
      remote: f.jobPost.remote,
      companySize: f.jobPost.companySize,
      industry: f.jobPost.industry,
      compMax: f.jobPost.compMax,
      skills: parseJson<string[]>(f.jobPost.skills, []),
    },
  }));

  const { result, engine } = await withFallback<IjpSuggestionItem[]>(
    async () => {
      const out = await runPrompt(
        "ijp-suggestions",
        {
          ijp: JSON.stringify(ijp, null, 2),
          feedback: feedback
            .map(
              (f) =>
                `- [${f.verdict.toUpperCase()}] "${f.reason || "(no reason given)"}" — ${f.job.title} @ ${f.job.company} (${f.job.remote}, ${f.job.companySize ?? "size unknown"}, ${f.job.industry ?? "industry unknown"}, comp max ${f.job.compMax ?? "unstated"}, skills: ${f.job.skills.join("/")})`,
            )
            .join("\n"),
        },
        IjpSuggestionsSchema,
      );
      return out.suggestions;
    },
    () => heuristicSuggestions(ijp, feedback),
  );

  // skip suggestions identical to one already pending
  const pending = await prisma.ijpSuggestion.findMany({
    where: { userId, status: "pending" },
  });
  const pendingKeys = new Set(
    pending.map((p) => {
      const c = parseJson<IjpSuggestionItem | null>(p.suggestedValue, null);
      return c ? `${c.field}|${c.action}|${c.value.toLowerCase()}` : "";
    }),
  );
  const fresh = result.filter(
    (s) => !pendingKeys.has(`${s.field}|${s.action}|${s.value.toLowerCase()}`),
  );

  const ijpSnapshot: Record<string, unknown> = ijp as unknown as Record<
    string,
    unknown
  >;
  // Feedback is only marked consumed when it actually produced suggestions —
  // otherwise a lone "no" would be burned before a second one arrives to
  // corroborate the trend.
  await prisma.$transaction([
    ...fresh.map((s) =>
      prisma.ijpSuggestion.create({
        data: {
          userId,
          field: s.field,
          currentValue: toJson(ijpSnapshot[s.field] ?? null),
          suggestedValue: toJson(s),
          rationale: s.rationale,
          sourceFeedback: toJson(feedback.map((f) => f.id)),
        },
      }),
    ),
    ...(fresh.length > 0
      ? [
          prisma.jobFeedback.updateMany({
            where: { id: { in: feedback.map((f) => f.id) } },
            data: { consumedAt: new Date() },
          }),
        ]
      : []),
  ]);

  // consumed = items analyzed this run (they stay unconsumed in the DB when
  // no suggestions came out, so their trend signal survives for next time)
  return { created: fresh.length, engine, consumed: feedback.length };
}
