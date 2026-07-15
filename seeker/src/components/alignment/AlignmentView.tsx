"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type RecommendationView = {
  id: string;
  bucketName: string;
  resumeLabel: string;
  type: string;
  lineNumber: number | null;
  currentText: string;
  suggestedText: string;
  reason: string;
  createdAt: string;
};

const TYPE_LABELS: Record<string, { label: string; cls: string }> = {
  replace: { label: "Replace line", cls: "bg-sky-100 text-sky-800" },
  add: { label: "Add line", cls: "bg-emerald-100 text-emerald-800" },
  remove: { label: "Remove line", cls: "bg-red-100 text-red-700" },
};

export function AlignmentView({
  buckets,
  resumes,
  recommendations,
}: {
  buckets: { id: string; name: string; jobCount: number }[];
  resumes: { id: string; label: string }[];
  recommendations: RecommendationView[];
}) {
  const router = useRouter();
  const [bucketId, setBucketId] = useState(buckets[0]?.id ?? "");
  const [resumeId, setResumeId] = useState(resumes[0]?.id ?? "");
  const [running, setRunning] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function analyze() {
    setRunning(true);
    setNotice(null);
    try {
      const res = await fetch("/api/alignment/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bucketId, resumeId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Analysis failed");
      setNotice(
        `Analysis complete (${data.engine}): ${data.created} recommendation${data.created === 1 ? "" : "s"} added to the review queue.`,
      );
      router.refresh();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : String(err));
    } finally {
      setRunning(false);
    }
  }

  async function resolve(id: string, action: "accept" | "reject") {
    setBusy(id);
    setNotice(null);
    try {
      const res = await fetch(`/api/alignment/recommendations/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update");
      router.refresh();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  }

  const inputCls =
    "rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs focus:border-indigo-500 focus:outline-none";

  return (
    <div>
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700">
          Run an alignment analysis
        </h2>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-[11px] font-medium text-slate-500">
              Bucket
            </label>
            <select
              value={bucketId}
              onChange={(e) => setBucketId(e.target.value)}
              className={`${inputCls} mt-1`}
            >
              {buckets.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.jobCount} jobs)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-500">
              Resume version
            </label>
            <select
              value={resumeId}
              onChange={(e) => setResumeId(e.target.value)}
              className={`${inputCls} mt-1`}
            >
              {resumes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={analyze}
            disabled={running || !bucketId || !resumeId}
            className="rounded-md bg-indigo-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {running ? "Comparing resume to bucket…" : "Analyze alignment"}
          </button>
        </div>
        {notice && <p className="mt-2 text-xs text-slate-600">{notice}</p>}
      </div>

      <h2 className="mb-3 mt-6 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Review queue{" "}
        {recommendations.length > 0 && (
          <span className="ml-1 rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white">
            {recommendations.length}
          </span>
        )}
      </h2>

      {recommendations.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
          Nothing pending. Run an analysis above — recommendations land here,
          and your stored resume only changes when you accept one.
        </div>
      ) : (
        <div className="space-y-3">
          {recommendations.map((rec) => {
            const type = TYPE_LABELS[rec.type] ?? {
              label: rec.type,
              cls: "bg-slate-100 text-slate-600",
            };
            return (
              <div
                key={rec.id}
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center gap-2 text-xs">
                  <span
                    className={`rounded px-2 py-0.5 font-semibold ${type.cls}`}
                  >
                    {type.label}
                    {rec.lineNumber != null && ` ${rec.lineNumber}`}
                  </span>
                  <span className="text-slate-400">
                    {rec.resumeLabel} ↔ {rec.bucketName}
                  </span>
                </div>
                {rec.currentText && (
                  <pre className="mt-2 whitespace-pre-wrap rounded bg-red-50 px-3 py-1.5 font-mono text-xs text-red-800 line-through decoration-red-300">
                    {rec.currentText}
                  </pre>
                )}
                {rec.suggestedText && (
                  <pre className="mt-1 whitespace-pre-wrap rounded bg-emerald-50 px-3 py-1.5 font-mono text-xs text-emerald-900">
                    {rec.suggestedText}
                  </pre>
                )}
                <p className="mt-2 text-xs leading-relaxed text-slate-600">
                  {rec.reason}
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => resolve(rec.id, "accept")}
                    disabled={busy === rec.id}
                    className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    Accept — update resume
                  </button>
                  <button
                    onClick={() => resolve(rec.id, "reject")}
                    disabled={busy === rec.id}
                    className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
