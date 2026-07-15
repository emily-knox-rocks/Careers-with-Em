"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function TouchpointForm() {
  const router = useRouter();
  const [contactName, setContactName] = useState("");
  const [company, setCompany] = useState("");
  const [channel, setChannel] = useState("call");
  const [occurredAt, setOccurredAt] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!contactName.trim()) {
      setError("Who did you talk to?");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/touchpoints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactName,
          company,
          channel,
          occurredAt: new Date(occurredAt + "T12:00:00Z").toISOString(),
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to log touchpoint");
      setContactName("");
      setCompany("");
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
        Log a networking touchpoint
      </h2>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-[11px] font-medium text-slate-500">
            Contact
          </label>
          <input
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            placeholder="name"
            className={`${inputCls} mt-1`}
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-slate-500">
            Company
          </label>
          <input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="optional"
            className={`${inputCls} mt-1`}
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-slate-500">
            Channel
          </label>
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            className={`${inputCls} mt-1`}
          >
            {["call", "coffee", "email", "linkedin", "event"].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-medium text-slate-500">
            Date
          </label>
          <input
            type="date"
            value={occurredAt}
            onChange={(e) => setOccurredAt(e.target.value)}
            className={`${inputCls} mt-1`}
          />
        </div>
        <div className="min-w-40 flex-1">
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
          className="rounded-md bg-slate-700 px-4 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {saving ? "Logging…" : "Log"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
