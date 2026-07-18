import { runPrompt, withFallback } from "@/lib/llm";
import { NormalizedJobSchema, type NormalizedJob } from "./ai/schemas";
import { heuristicNormalizeJob } from "./ai/fallback/job";

// Ingestion module: paste a URL or raw job-description text, get back a
// normalized job record. This is the single seam where a real job-board API
// can plug in later — downstream ranking code only ever sees NormalizedJob.

export type IngestInput = {
  url?: string;
  rawText?: string;
};

export type IngestResult = {
  job: NormalizedJob;
  sourceUrl: string | null;
  engine: "llm" | "heuristic";
};

const MAX_CHARS = 24000;

function stripHtml(html: string): string {
  return html
    .replace(/<head[\s\S]*?<\/head>/gi, " ") // <title>/meta must not become line 1
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    .replace(/<(br|p|div|li|h[1-6]|tr)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .trim();
}

async function fetchUrlText(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "SeekerBot/0.1 (personal job-search tool)" },
    });
    if (!res.ok) {
      throw new Error(`Fetching the URL failed with HTTP ${res.status}`);
    }
    const html = await res.text();
    const text = stripHtml(html);
    if (text.length < 200) {
      throw new Error(
        "The page returned too little text (it may be rendered with JavaScript) — paste the posting text instead.",
      );
    }
    return text;
  } finally {
    clearTimeout(timer);
  }
}

export async function ingestJobPost(input: IngestInput): Promise<IngestResult> {
  let raw = input.rawText?.trim() ?? "";
  let sourceUrl: string | null = null;

  if (!raw && input.url) {
    sourceUrl = input.url;
    raw = await fetchUrlText(input.url);
  }
  if (!raw) {
    throw new Error("Provide a URL or the raw posting text.");
  }
  raw = raw.slice(0, MAX_CHARS);

  const { result, engine } = await withFallback<NormalizedJob>(
    () => runPrompt("job-normalize", { raw }, NormalizedJobSchema),
    () => heuristicNormalizeJob(raw),
  );

  return { job: result, sourceUrl, engine };
}
