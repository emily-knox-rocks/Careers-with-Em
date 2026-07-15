import { runPrompt, withFallback } from "@/lib/llm";
import { CallSummarySchema, type CallSummary } from "./schemas";
import { getCallTemplate, templateSectionsForPrompt } from "./callTemplates";
import { heuristicCallSummary } from "./fallback/call";

// Upload-based notetaker: numbered transcript in, structured summary out,
// every live point citing the transcript lines it came from. Additional
// sources (job description, resume) can contribute clearly-labeled points —
// the Metaview multi-source pattern, mirrored.

export type CallSources = {
  jobTitle?: string | null;
  jobDescription?: string | null;
  jobSkills?: string[];
  resumeContent?: string | null;
};

// Strip VTT/SRT chrome so citations reference meaningful lines.
export function normalizeTranscript(raw: string): string {
  let text = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  if (/^WEBVTT/m.test(text) || /-->/m.test(text)) {
    text = text
      .split("\n")
      .filter(
        (line) =>
          !/^WEBVTT/.test(line) &&
          !/^\d+$/.test(line.trim()) &&
          !/-->/.test(line) &&
          !/^NOTE\b/.test(line),
      )
      .join("\n");
  }
  // collapse runs of blank lines so line numbers stay dense
  return text.replace(/\n{3,}/g, "\n\n").trim();
}

export function transcriptLines(transcript: string): string[] {
  return transcript.split("\n");
}

export async function summarizeCall(
  transcript: string,
  templateId: string,
  sources: CallSources,
): Promise<{ summary: CallSummary; engine: "llm" | "heuristic" }> {
  const template = getCallTemplate(templateId);
  const lines = transcriptLines(transcript);
  const numbered = lines.map((l, i) => `${i + 1}: ${l}`).join("\n");

  const sourceParts: string[] = [];
  if (sources.jobDescription) {
    sourceParts.push(
      `<job_description title="${sources.jobTitle ?? ""}">\n${sources.jobDescription.slice(0, 6000)}\n</job_description>`,
    );
  }
  if (sources.resumeContent) {
    sourceParts.push(
      `<resume>\n${sources.resumeContent.slice(0, 6000)}\n</resume>`,
    );
  }
  const sourcesText =
    sourceParts.length > 0 ? sourceParts.join("\n\n") : "(no additional sources attached)";

  const { result, engine } = await withFallback<CallSummary>(
    () =>
      runPrompt(
        "call-summary",
        {
          templateSections: templateSectionsForPrompt(template),
          transcript: numbered,
          sources: sourcesText,
        },
        CallSummarySchema,
      ),
    () =>
      heuristicCallSummary(lines, template, {
        jobSkills: sources.jobSkills ?? [],
        jobTitle: sources.jobTitle ?? null,
        resumeHead: sources.resumeContent
          ? // skip the name/contact block — headline terms live below it
            sources.resumeContent.split("\n").slice(2, 10).join(" ")
          : null,
      }),
  );

  // clamp citations to real line numbers so the UI never links nowhere
  const clamped: CallSummary = {
    sections: result.sections.map((s) => ({
      title: s.title,
      points: s.points.map((pt) => ({
        ...pt,
        citations: pt.citations.filter((n) => n >= 1 && n <= lines.length),
      })),
    })),
    notCovered: result.notCovered,
  };

  return { summary: clamped, engine };
}
