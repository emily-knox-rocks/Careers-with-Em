import type { CallSummary, SummaryPoint } from "../schemas";
import type { CallTemplate } from "../callTemplates";

// Heuristic call summarizer without an API key: keyword-match transcript
// lines into the template's sections (citing the matched lines), and flag
// document facts never discussed live (multi-source pattern) by checking
// attached JD skills / resume headline terms against the transcript.

const MAX_POINTS_PER_SECTION = 4;
const SMALL_TALK =
  /^(hi|hey|hello|thanks|thank you|great|awesome|cool|yeah|yes|no|ok(ay)?|sure|sounds good|perfect|nice to meet)/i;

function speakerStripped(line: string): string {
  return line.replace(/^[A-Za-z .'-]{2,30}:\s*/, "").trim();
}

export function heuristicCallSummary(
  transcriptLines: string[],
  template: CallTemplate,
  sources: { jobSkills: string[]; jobTitle: string | null; resumeHead: string | null },
): CallSummary {
  const claimed = new Set<number>();

  const sections = template.sections.map((section) => {
    const points: SummaryPoint[] = [];
    for (let i = 0; i < transcriptLines.length; i++) {
      if (points.length >= MAX_POINTS_PER_SECTION) break;
      if (claimed.has(i)) continue;
      const raw = transcriptLines[i].trim();
      const content = speakerStripped(raw);
      if (content.length < 25) continue;
      // only skip short pleasantries — long lines that OPEN with one
      // ("Great. In my last role I…") still carry substance
      if (content.length < 60 && SMALL_TALK.test(content)) continue;
      if (section.matchers.some((re) => re.test(raw))) {
        claimed.add(i);
        points.push({
          text: content.length > 180 ? content.slice(0, 177) + "…" : content,
          citations: [i + 1],
          origin: "transcript",
        });
      }
    }
    return { title: section.title, points };
  });

  // multi-source: JD skills never mentioned live
  const transcriptLower = transcriptLines.join(" ").toLowerCase();
  const notCovered: CallSummary["notCovered"] = [];
  for (const skill of sources.jobSkills) {
    const s = skill.trim();
    if (!s || s === "(none detected)") continue;
    if (!transcriptLower.includes(s.toLowerCase())) {
      notCovered.push({
        text: `The job description asks for "${s}" — it never came up in the call.`,
        origin: "job_description",
      });
    }
    if (notCovered.length >= 4) break;
  }
  if (sources.resumeHead) {
    const headTerms = sources.resumeHead
      .split(/[,.;]/)
      .map((t) => t.trim())
      // skip name/contact fragments: all-caps runs, emails, phone-ish digits
      .filter(
        (t) =>
          t.length > 12 &&
          !/[@\d]/.test(t) &&
          t !== t.toUpperCase() &&
          /[a-z]/.test(t),
      )
      .slice(0, 3);
    for (const term of headTerms) {
      if (!transcriptLower.includes(term.toLowerCase())) {
        notCovered.push({
          text: `Your resume highlights "${term}" — you didn't get to mention it.`,
          origin: "resume",
        });
        break;
      }
    }
  }

  return { sections, notCovered };
}
