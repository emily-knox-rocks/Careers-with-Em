"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const TEMPLATES = [
  { id: "recruiter_screen", label: "Recruiter screen" },
  { id: "hiring_manager", label: "Hiring manager interview" },
  { id: "networking", label: "Networking call" },
];

export default function NewCallPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [template, setTemplate] = useState("recruiter_screen");
  const [transcript, setTranscript] = useState("");
  const [jobs, setJobs] = useState<{ id: string; label: string }[]>([]);
  const [resumes, setResumes] = useState<{ id: string; label: string }[]>([]);
  const [jobPostId, setJobPostId] = useState("");
  const [resumeId, setResumeId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/calls/sources")
      .then((r) => r.json())
      .then((d) => {
        setJobs(d.jobs ?? []);
        setResumes(d.resumes ?? []);
      })
      .catch(() => {});
  }, []);

  function onFile(file: File | undefined) {
    if (!file) return;
    if (/\.(mp3|m4a|wav|mp4|mov|ogg|webm)$/i.test(file.name)) {
      setError(
        "Audio transcription isn't in the MVP — export/paste the transcript text instead (e.g. from Zoom, Meet, or Otter).",
      );
      return;
    }
    setError(null);
    file.text().then((text) => setTranscript(text));
    if (!title) setTitle(file.name.replace(/\.[^.]+$/, ""));
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title || "Untitled call",
          template,
          transcript,
          jobPostId: jobPostId || null,
          resumeId: resumeId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Summarization failed");
      router.push(`/calls/${data.call.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSubmitting(false);
    }
  }

  const inputCls =
    "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none";
  const labelCls = "block text-sm font-medium text-slate-700";

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold">New call summary</h1>
      <p className="mt-1 text-sm text-slate-600">
        Upload or paste the transcript after an interview or networking call.
        Every summary point cites the transcript line it came from; attach the
        job description and your resume to pull in what wasn&apos;t discussed
        live.
      </p>

      <div className="mt-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Recruiter screen — Pathlight Labs"
              className={`${inputCls} mt-1`}
            />
          </div>
          <div>
            <label className={labelCls}>Template</label>
            <select
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              className={`${inputCls} mt-1`}
            >
              {TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className={labelCls}>Transcript</label>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="text-xs font-medium text-indigo-600 hover:underline"
            >
              Upload .txt / .vtt file
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".txt,.vtt,.srt,.md,text/plain"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
          </div>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            rows={12}
            placeholder={"Paste the transcript…\n\nRecruiter: Thanks for making time today…\nEmily: Glad to be here…"}
            className={`${inputCls} mt-1 font-mono text-xs`}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>
              Job description source{" "}
              <span className="text-slate-400">(optional)</span>
            </label>
            <select
              value={jobPostId}
              onChange={(e) => setJobPostId(e.target.value)}
              className={`${inputCls} mt-1`}
            >
              <option value="">— none —</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>
              Resume source <span className="text-slate-400">(optional)</span>
            </label>
            <select
              value={resumeId}
              onChange={(e) => setResumeId(e.target.value)}
              className={`${inputCls} mt-1`}
            >
              <option value="">— none —</option>
              {resumes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
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
          {submitting ? "Summarizing…" : "Summarize call"}
        </button>
      </div>
    </div>
  );
}
