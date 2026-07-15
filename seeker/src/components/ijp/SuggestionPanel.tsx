"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { parseJson } from "@/lib/jsonField";
import type { IjpSuggestionItem } from "@/lib/ai/schemas";

export type SuggestionView = {
  id: string;
  field: string;
  currentValue: string;
  suggestedValue: string;
  rationale: string;
  createdAt: string;
};

const FIELD_LABELS: Record<string, string> = {
  targetRoles: "Target roles",
  industries: "Industries",
  seniority: "Seniority",
  locations: "Locations",
  remotePreference: "Remote preference",
  compensationFloor: "Compensation floor",
  companySizePreference: "Company size",
  dealbreakers: "Dealbreakers",
  skills: "Skills",
  notes: "Notes",
};

function describeChange(suggestedValue: string): string {
  const change = parseJson<Pick<
    IjpSuggestionItem,
    "action" | "value" | "skillPriority"
  > | null>(suggestedValue, null);
  if (!change) return suggestedValue;
  switch (change.action) {
    case "add":
      return `Add "${change.value}"${change.skillPriority ? ` (${change.skillPriority}-have)` : ""}`;
    case "remove":
      return `Remove "${change.value}"`;
    case "set":
      return `Set to "${change.value}"`;
    default:
      return change.value;
  }
}

export function SuggestionPanel({
  suggestions,
}: {
  suggestions: SuggestionView[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function resolve(id: string, action: "accept" | "reject") {
    setBusy(id);
    setError(null);
    try {
      const res = await fetch(`/api/ijp/suggestions/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to update suggestion");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  }

  if (suggestions.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
        No pending suggestions. As you leave yes/maybe/no feedback on jobs,
        the agent proposes profile updates here — you confirm every change.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      {suggestions.map((s) => (
        <div
          key={s.id}
          className="rounded-lg border border-indigo-200 bg-indigo-50/60 p-4 shadow-sm"
        >
          <div className="text-xs font-semibold uppercase tracking-wide text-indigo-500">
            {FIELD_LABELS[s.field] ?? s.field}
          </div>
          <div className="mt-1 text-sm font-medium text-slate-900">
            {describeChange(s.suggestedValue)}
          </div>
          <p className="mt-1 text-xs text-slate-600">{s.rationale}</p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => resolve(s.id, "accept")}
              disabled={busy === s.id}
              className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              Confirm
            </button>
            <button
              onClick={() => resolve(s.id, "reject")}
              disabled={busy === s.id}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
