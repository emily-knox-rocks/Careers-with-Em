import type { ResumeRecommendationItem } from "../schemas";

// Conservative heuristic alignment recommendations without an API key.
// Postings phrase the same competency differently ("1:1 coaching" vs "career
// coaching"), so frequency is counted at the token level and surfaced with
// the most common full phrase. Never fabricates experience — the reasons tell
// the user to only accept what is true for them.

export type BucketJobLite = {
  title: string;
  company: string;
  skills: string[];
  description: string;
};

const STOPWORDS = new Set([
  "with", "and", "the", "for", "from", "management", "experience", "skills",
  "tools", "strong", "ability", "years", "team", "teams", "work", "working",
  "knowledge", "excellent", "proven", "related", "other", "support",
]);

function tokensOf(phrase: string): string[] {
  return phrase
    .toLowerCase()
    .split(/[^a-z0-9+#]+/)
    .filter((t) => t.length >= 4 && !STOPWORDS.has(t));
}

export function heuristicAlignRecommendations(
  resume: string,
  jobs: BucketJobLite[],
  bucketName: string,
): ResumeRecommendationItem[] {
  const resumeLower = resume.toLowerCase();
  const lines = resume.split("\n");

  // token frequency across postings (each token counts once per posting) and
  // the phrases each token appeared in
  const tokenFreq = new Map<string, number>();
  const tokenPhrases = new Map<string, Map<string, number>>();
  for (const job of jobs) {
    const seen = new Set<string>();
    for (const phrase of job.skills) {
      const clean = phrase.trim();
      if (!clean || clean === "(none detected)") continue;
      for (const tok of tokensOf(clean)) {
        if (!seen.has(tok)) {
          seen.add(tok);
          tokenFreq.set(tok, (tokenFreq.get(tok) ?? 0) + 1);
        }
        const phrases = tokenPhrases.get(tok) ?? new Map<string, number>();
        phrases.set(clean.toLowerCase(), (phrases.get(clean.toLowerCase()) ?? 0) + 1);
        tokenPhrases.set(tok, phrases);
      }
    }
  }

  const threshold = Math.max(2, Math.ceil(jobs.length * 0.3));
  const recurring = [...tokenFreq.entries()]
    .filter(([, n]) => n >= threshold)
    .sort((a, b) => b[1] - a[1]);

  const phraseFor = (token: string): string => {
    const phrases = tokenPhrases.get(token);
    if (!phrases) return token;
    return [...phrases.entries()].sort((a, b) => b[1] - a[1])[0][0];
  };

  // missing: recurring token absent from the resume entirely
  const missing: { phrase: string; token: string; count: number }[] = [];
  const usedPhrases = new Set<string>();
  for (const [token, count] of recurring) {
    if (resumeLower.includes(token)) continue;
    const phrase = phraseFor(token);
    if (usedPhrases.has(phrase)) continue;
    usedPhrases.add(phrase);
    missing.push({ phrase, token, count });
    if (missing.length >= 4) break;
  }

  const recs: ResumeRecommendationItem[] = [];

  const skillsLineIdx = lines.findIndex((l) => /^skills\b/i.test(l.trim()));
  if (missing.length > 0) {
    const additions = missing.map((m) => m.phrase).join(", ");
    const evidence = missing
      .map((m) => `"${m.phrase}" (theme in ${m.count}/${jobs.length} postings)`)
      .join("; ");
    if (skillsLineIdx >= 0) {
      recs.push({
        type: "replace",
        lineNumber: skillsLineIdx + 1,
        currentText: lines[skillsLineIdx],
        suggestedText: `${lines[skillsLineIdx].replace(/\s*$/, "")}, ${additions}`,
        reason: `${evidence} across "${bucketName}", but none appear anywhere in this resume. Only accept the ones that are genuinely true for you.`,
      });
    } else {
      recs.push({
        type: "add",
        lineNumber: null,
        currentText: "",
        suggestedText: `SKILLS: ${additions}`,
        reason: `The resume has no skills line, and these themes recur across "${bucketName}" postings: ${evidence}. Only accept what is genuinely true for you.`,
      });
    }
  }

  // buried: recurring theme present in the resume body but absent from the
  // first ~8 lines (the part a recruiter skims first)
  const head = lines.slice(0, 8).join(" ").toLowerCase();
  const buried = recurring
    .filter(([tok]) => resumeLower.includes(tok) && !head.includes(tok))
    .slice(0, 2);
  const summaryIdx = lines.findIndex((l) =>
    /^(summary|profile|about)\b/i.test(l.trim()),
  );
  if (buried.length > 0 && summaryIdx >= 0 && lines[summaryIdx + 1]) {
    const anchor = lines[summaryIdx + 1];
    const phrases = buried.map(([tok]) => phraseFor(tok));
    recs.push({
      type: "replace",
      lineNumber: summaryIdx + 2,
      currentText: anchor,
      suggestedText:
        anchor.replace(/\.?\s*$/, "") + `. Core strengths: ${phrases.join(", ")}.`,
      reason: `${buried.map(([tok, n]) => `"${phraseFor(tok)}" is a theme in ${n}/${jobs.length} postings`).join("; ")} and appears in your resume, but not in the summary a recruiter reads first.`,
    });
  }

  return recs;
}
