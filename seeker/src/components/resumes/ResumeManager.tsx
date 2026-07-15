"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type ResumeView = {
  id: string;
  label: string;
  content: string;
  createdAt: string;
  applicationCount: number;
};

export function ResumeManager({ resumes }: { resumes: ResumeView[] }) {
  const router = useRouter();
  const [open, setOpen] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/resumes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to add resume");
      setAdding(false);
      setLabel("");
      setContent("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {resumes.map((resume) => (
        <div
          key={resume.id}
          className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium text-slate-900">{resume.label}</span>
              <span className="ml-3 text-xs text-slate-400">
                added {new Date(resume.createdAt).toLocaleDateString()} · used
                in {resume.applicationCount} application
                {resume.applicationCount === 1 ? "" : "s"}
              </span>
            </div>
            <button
              onClick={() => setOpen(open === resume.id ? null : resume.id)}
              className="text-xs font-medium text-indigo-600 hover:underline"
            >
              {open === resume.id ? "Hide" : "View"}
            </button>
          </div>
          {open === resume.id && (
            <pre className="mt-3 max-h-96 overflow-y-auto whitespace-pre-wrap rounded-md bg-slate-50 p-3 font-mono text-xs leading-relaxed text-slate-700">
              {resume.content}
            </pre>
          )}
        </div>
      ))}

      {adding ? (
        <div className="rounded-lg border border-indigo-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700">
            New resume version
          </h2>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder='Label, e.g. "v2 — coaching-focused"'
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={12}
            placeholder="Paste the full resume text…"
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-xs focus:border-indigo-500 focus:outline-none"
          />
          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
          <div className="mt-3 flex gap-2">
            <button
              onClick={submit}
              disabled={saving}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save version"}
            </button>
            <button
              onClick={() => setAdding(false)}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + New resume version
        </button>
      )}
    </div>
  );
}
