"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const COMPANY_SIZES = [
  "startup (<50)",
  "scaleup (50-500)",
  "mid-size (500-5000)",
  "enterprise (5000+)",
];

export default function NewIjpPage() {
  const router = useRouter();
  const [resume, setResume] = useState("");
  const [targetRoles, setTargetRoles] = useState("");
  const [industries, setIndustries] = useState("");
  const [seniority, setSeniority] = useState("");
  const [locations, setLocations] = useState("");
  const [remotePreference, setRemotePreference] = useState<
    "remote" | "hybrid" | "onsite" | "flexible"
  >("flexible");
  const [compensationFloor, setCompensationFloor] = useState("");
  const [companySizePreference, setCompanySizePreference] = useState<string[]>(
    [],
  );
  const [dealbreakers, setDealbreakers] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/ijp/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume,
          intake: {
            targetRoles,
            industries,
            seniority,
            locations,
            remotePreference,
            compensationFloor,
            companySizePreference,
            dealbreakers,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Draft failed");
      router.push("/ijp");
      router.refresh();
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
      <h1 className="text-2xl font-semibold">Draft your Ideal Job Profile</h1>
      <p className="mt-1 text-sm text-slate-600">
        Paste your resume and answer a short intake. Seeker drafts the IJP;
        you do the final 5% — every field stays hand-editable.
      </p>

      <div className="mt-6 space-y-5">
        <div>
          <label className={labelCls}>Resume (paste the full text)</label>
          <textarea
            value={resume}
            onChange={(e) => setResume(e.target.value)}
            rows={10}
            placeholder="Paste your resume here…"
            className={`${inputCls} mt-1 font-mono text-xs`}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>
              Target roles <span className="text-slate-400">(comma-separated)</span>
            </label>
            <input
              value={targetRoles}
              onChange={(e) => setTargetRoles(e.target.value)}
              placeholder="e.g. Senior Product Manager, Growth PM"
              className={`${inputCls} mt-1`}
            />
          </div>
          <div>
            <label className={labelCls}>Target seniority</label>
            <input
              value={seniority}
              onChange={(e) => setSeniority(e.target.value)}
              placeholder="e.g. Senior"
              className={`${inputCls} mt-1`}
            />
          </div>
          <div>
            <label className={labelCls}>
              Industries of interest <span className="text-slate-400">(optional)</span>
            </label>
            <input
              value={industries}
              onChange={(e) => setIndustries(e.target.value)}
              placeholder="e.g. HR tech, SaaS"
              className={`${inputCls} mt-1`}
            />
          </div>
          <div>
            <label className={labelCls}>
              Locations{" "}
              <span className="text-slate-400">
                (optional; separate multiple with “;”)
              </span>
            </label>
            <input
              value={locations}
              onChange={(e) => setLocations(e.target.value)}
              placeholder="e.g. Denver, CO; Remote"
              className={`${inputCls} mt-1`}
            />
          </div>
          <div>
            <label className={labelCls}>Remote preference</label>
            <select
              value={remotePreference}
              onChange={(e) =>
                setRemotePreference(
                  e.target.value as typeof remotePreference,
                )
              }
              className={`${inputCls} mt-1`}
            >
              <option value="remote">Remote only</option>
              <option value="hybrid">Hybrid</option>
              <option value="onsite">On-site</option>
              <option value="flexible">Flexible</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>
              Compensation floor <span className="text-slate-400">(annual base)</span>
            </label>
            <input
              value={compensationFloor}
              onChange={(e) => setCompensationFloor(e.target.value)}
              placeholder="e.g. 140000"
              className={`${inputCls} mt-1`}
            />
          </div>
        </div>

        <div>
          <label className={labelCls}>Company size preference</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {COMPANY_SIZES.map((size) => {
              const checked = companySizePreference.includes(size);
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() =>
                    setCompanySizePreference((prev) =>
                      checked
                        ? prev.filter((s) => s !== size)
                        : [...prev, size],
                    )
                  }
                  className={`rounded-full border px-3 py-1 text-sm ${
                    checked
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                      : "border-slate-300 bg-white text-slate-600 hover:border-slate-400"
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className={labelCls}>
            Dealbreakers{" "}
            <span className="text-slate-400">
              (comma-separated hard exclusions)
            </span>
          </label>
          <input
            value={dealbreakers}
            onChange={(e) => setDealbreakers(e.target.value)}
            placeholder="e.g. no on-call, no gambling companies"
            className={`${inputCls} mt-1`}
          />
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
          {submitting ? "Drafting your IJP…" : "Draft my IJP"}
        </button>
      </div>
    </div>
  );
}
