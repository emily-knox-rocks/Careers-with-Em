"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NewApplicationForm({
  jobs,
  resumes,
}: {
  jobs: { id: string; label: string }[];
  resumes: { id: string; label: string }[];
}) {
  const router = useRouter();
  const [jobPostId, setJobPostId] = useState("");
  const [resumeId, setResumeId] = useState(resumes[0]?.id ?? "");
  const [appliedAt, setAppliedAt] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!jobPostId || !resumeId) {
      setError("Pick a job and a resume version.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobPostId,
          resumeId,
          // cleared date field -> let the server default to now
          appliedAt: appliedAt
            ? new Date(appliedAt + "T12:00:00Z").toISOString()
            : undefined,
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to add application");
      setJobPostId("");
      setNotes("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    "rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs focus:border-indigo-500 focus:outline-none";

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-700">
        Track an application
      </h2>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <div className="min-w-64 flex-1">
          <label className="block text-[11px] font-medium text-slate-500">
            Job
          </label>
          <select
            value={jobPostId}
            onChange={(e) => setJobPostId(e.target.value)}
            className={`${inputCls} mt-1 w-full`}
          >
            <option value="">— select a job —</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.label}
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
        <div>
          <label className="block text-[11px] font-medium text-slate-500">
            Date applied
          </label>
          <input
            type="date"
            value={appliedAt}
            onChange={(e) => setAppliedAt(e.target.value)}
            className={`${inputCls} mt-1`}
          />
        </div>
        <div className="min-w-48 flex-1">
          <label className="block text-[11px] font-medium text-slate-500">
            Notes
          </label>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="optional"
            className={`${inputCls} mt-1 w-full`}
          />
        </div>
        <button
          onClick={submit}
          disabled={saving}
          className="rounded-md bg-indigo-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? "Adding…" : "Add"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
