"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { STAGES } from "@/lib/stages";

export type ApplicationRowView = {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  bucketName: string | null;
  resumeLabel: string;
  appliedAt: string;
  stage: string;
  notes: string;
};

const STAGE_STYLES: Record<string, string> = {
  applied: "bg-slate-100 text-slate-700",
  screen: "bg-sky-100 text-sky-800",
  interview: "bg-indigo-100 text-indigo-800",
  offer: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-700",
  ghosted: "bg-slate-200 text-slate-500",
};

export function ApplicationsTable({ rows }: { rows: ApplicationRowView[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function setStage(id: string, stage: string) {
    setBusy(id);
    try {
      await fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage }),
      });
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
        No applications tracked yet. Add one below — every application records
        the job, the bucket, and the resume version you used, so the dashboards
        can tell you what&apos;s working.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            {["Role", "Bucket", "Resume", "Applied", "Stage", "Notes"].map(
              (h) => (
                <th
                  key={h}
                  className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500"
                >
                  {h}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-slate-50/70">
              <td className="max-w-64 px-3 py-2.5">
                <Link
                  href={`/jobs/${row.jobId}`}
                  className="font-medium text-slate-900 hover:text-indigo-700 hover:underline"
                >
                  {row.jobTitle}
                </Link>
                <div className="text-xs text-slate-500">{row.company}</div>
              </td>
              <td className="px-3 py-2.5 text-xs text-slate-600">
                {row.bucketName ?? "—"}
              </td>
              <td className="px-3 py-2.5 text-xs text-slate-600">
                {row.resumeLabel}
              </td>
              <td className="px-3 py-2.5 text-xs text-slate-600">
                {new Date(row.appliedAt).toLocaleDateString()}
              </td>
              <td className="px-3 py-2.5">
                <select
                  value={row.stage}
                  disabled={busy === row.id}
                  onChange={(e) => setStage(row.id, e.target.value)}
                  className={`rounded-md border-0 px-2 py-1 text-xs font-medium ${STAGE_STYLES[row.stage] ?? "bg-slate-100"}`}
                >
                  {STAGES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </td>
              <td
                className="max-w-56 truncate px-3 py-2.5 text-xs text-slate-500"
                title={row.notes}
              >
                {row.notes || "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
