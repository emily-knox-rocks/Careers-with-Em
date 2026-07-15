"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const VERDICT_STYLES: Record<string, { active: string; idle: string }> = {
  yes: {
    active: "bg-emerald-600 text-white border-emerald-600",
    idle: "border-slate-300 text-slate-500 hover:border-emerald-500 hover:text-emerald-600",
  },
  maybe: {
    active: "bg-amber-500 text-white border-amber-500",
    idle: "border-slate-300 text-slate-500 hover:border-amber-500 hover:text-amber-600",
  },
  no: {
    active: "bg-red-500 text-white border-red-500",
    idle: "border-slate-300 text-slate-500 hover:border-red-500 hover:text-red-600",
  },
};

// Yes/maybe/no + one-line reason, exactly the Metaview calibration gesture:
// pick a verdict, tell the agent why in a line, move on.
export function FeedbackControl({
  jobId,
  current,
}: {
  jobId: string;
  current: { verdict: string; reason: string } | null;
}) {
  const router = useRouter();
  const [picking, setPicking] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  async function save(verdict: string, reasonText: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verdict, reason: reasonText }),
      });
      if (res.ok) {
        setPicking(null);
        setReason("");
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <div className="flex gap-1">
        {(["yes", "maybe", "no"] as const).map((v) => {
          const isActive = picking ? picking === v : current?.verdict === v;
          return (
            <button
              key={v}
              onClick={() => {
                setPicking(v);
                setReason(current?.verdict === v ? current.reason : "");
              }}
              className={`rounded border px-2 py-0.5 text-xs font-medium capitalize transition-colors ${
                isActive ? VERDICT_STYLES[v].active : VERDICT_STYLES[v].idle
              }`}
            >
              {v}
            </button>
          );
        })}
      </div>
      {picking && (
        <div className="mt-1.5 flex gap-1">
          <input
            autoFocus
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") save(picking, reason);
              if (e.key === "Escape") setPicking(null);
            }}
            placeholder="Why? (one line, trains the agent)"
            className="w-48 rounded border border-slate-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none"
          />
          <button
            onClick={() => save(picking, reason)}
            disabled={saving}
            className="rounded bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            Save
          </button>
        </div>
      )}
      {!picking && current?.reason && (
        <p
          className="mt-1 max-w-52 truncate text-[11px] italic text-slate-400"
          title={current.reason}
        >
          “{current.reason}”
        </p>
      )}
    </div>
  );
}
