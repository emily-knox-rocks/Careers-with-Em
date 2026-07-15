"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CallSummary } from "@/lib/ai/schemas";

const ORIGIN_BADGES: Record<string, { label: string; cls: string }> = {
  job_description: {
    label: "from JD — not discussed live",
    cls: "bg-amber-100 text-amber-800",
  },
  resume: {
    label: "from resume — not discussed live",
    cls: "bg-sky-100 text-sky-800",
  },
};

const TEMPLATES = [
  { id: "recruiter_screen", label: "Recruiter screen" },
  { id: "hiring_manager", label: "Hiring manager interview" },
  { id: "networking", label: "Networking call" },
];

export function CallSummaryView({
  callId,
  template,
  summary,
  transcript,
  engine,
}: {
  callId: string;
  template: string;
  summary: CallSummary;
  transcript: string;
  engine: string;
}) {
  const router = useRouter();
  const lines = transcript.split("\n");
  const [highlight, setHighlight] = useState<number | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function jumpTo(line: number) {
    setHighlight(line);
    document
      .getElementById(`tline-${line}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  async function regenerate(nextTemplate: string) {
    setRegenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/calls/${callId}/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template: nextTemplate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Regeneration failed");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRegenerating(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      {/* summary pane */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <label className="text-xs font-medium text-slate-500">
            Template
          </label>
          <select
            value={template}
            disabled={regenerating}
            onChange={(e) => regenerate(e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs"
          >
            {TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => regenerate(template)}
            disabled={regenerating}
            className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            {regenerating ? "Regenerating…" : "Regenerate"}
          </button>
          <span className="ml-auto text-[10px] text-slate-400">
            engine: {engine}
          </span>
        </div>
        {error && (
          <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {summary.sections.map((section) => (
            <div
              key={section.title}
              className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
            >
              <h2 className="text-sm font-semibold text-slate-800">
                {section.title}
              </h2>
              {section.points.length === 0 ? (
                <p className="mt-1.5 text-xs italic text-slate-400">
                  Nothing captured for this section.
                </p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {section.points.map((point, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
                      <div className="leading-snug text-slate-700">
                        {point.text}{" "}
                        {point.origin === "transcript" ? (
                          point.citations.map((line) => (
                            <button
                              key={line}
                              onClick={() => jumpTo(line)}
                              title={lines[line - 1] ?? ""}
                              className="ml-0.5 rounded bg-indigo-50 px-1 py-0.5 align-baseline font-mono text-[10px] font-medium text-indigo-600 hover:bg-indigo-100"
                            >
                              L{line}
                            </button>
                          ))
                        ) : (
                          <span
                            className={`ml-1 rounded px-1.5 py-0.5 align-baseline text-[10px] font-medium ${ORIGIN_BADGES[point.origin]?.cls ?? "bg-slate-100 text-slate-500"}`}
                          >
                            {ORIGIN_BADGES[point.origin]?.label ?? point.origin}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}

          {summary.notCovered.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-amber-900">
                In the documents, not discussed live
              </h2>
              <ul className="mt-2 space-y-1.5">
                {summary.notCovered.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-amber-900"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                    <span className="leading-snug">
                      {item.text}{" "}
                      <span className="ml-1 rounded bg-white/70 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                        {item.origin === "job_description" ? "JD" : "resume"}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* transcript pane */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700">
          Transcript{" "}
          <span className="font-normal text-slate-400">
            — the source of truth behind every citation
          </span>
        </div>
        <div className="max-h-[75vh] overflow-y-auto p-3 font-mono text-xs leading-relaxed">
          {lines.map((line, i) => (
            <div
              key={i}
              id={`tline-${i + 1}`}
              className={`flex gap-2 rounded px-1 py-0.5 ${highlight === i + 1 ? "bg-indigo-50 ring-1 ring-indigo-200" : ""}`}
            >
              <span className="w-8 shrink-0 select-none text-right text-slate-300">
                {i + 1}
              </span>
              <span className="whitespace-pre-wrap text-slate-700">
                {line || " "}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
