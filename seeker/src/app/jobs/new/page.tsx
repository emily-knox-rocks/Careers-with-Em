"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function NewJobPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"paste" | "url">("paste");
  const [rawText, setRawText] = useState("");
  const [url, setUrl] = useState("");
  const [buckets, setBuckets] = useState<{ id: string; name: string }[]>([]);
  const [bucketId, setBucketId] = useState<string>("");
  const [newBucketName, setNewBucketName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/buckets")
      .then((r) => r.json())
      .then((d) => setBuckets(d.buckets ?? []))
      .catch(() => {});
  }, []);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/jobs/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: mode === "url" ? url : undefined,
          rawText: mode === "paste" ? rawText : undefined,
          bucketId: bucketId || null,
          newBucketName: bucketId ? undefined : newBucketName,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Ingestion failed");
      router.push("/jobs");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSubmitting(false);
    }
  }

  const inputCls =
    "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none";

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold">Add a job</h1>
      <p className="mt-1 text-sm text-slate-600">
        Paste a posting (or a URL) — Seeker normalizes it into a structured
        record and ranks it against your IJP. A live job-board source can plug
        into this same pipe later.
      </p>

      <div className="mt-5 flex gap-2">
        {(["paste", "url"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`rounded-md border px-3 py-1.5 text-sm font-medium ${
              mode === m
                ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                : "border-slate-300 bg-white text-slate-600"
            }`}
          >
            {m === "paste" ? "Paste text" : "From URL"}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-4">
        {mode === "paste" ? (
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            rows={14}
            placeholder="Paste the full job posting text here…"
            className={`${inputCls} font-mono text-xs`}
          />
        ) : (
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…"
            className={inputCls}
          />
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Bucket
            </label>
            <select
              value={bucketId}
              onChange={(e) => setBucketId(e.target.value)}
              className={`${inputCls} mt-1`}
            >
              <option value="">— new bucket / none —</option>
              {buckets.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          {!bucketId && (
            <div>
              <label className="block text-sm font-medium text-slate-700">
                New bucket name{" "}
                <span className="text-slate-400">(optional)</span>
              </label>
              <input
                value={newBucketName}
                onChange={(e) => setNewBucketName(e.target.value)}
                placeholder="e.g. Career Coaching & Services"
                className={`${inputCls} mt-1`}
              />
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          onClick={submit}
          disabled={submitting}
          className="rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {submitting ? "Ingesting & ranking…" : "Ingest & rank"}
        </button>
      </div>
    </div>
  );
}
