"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { IjpData, IjpSkill } from "@/lib/ai/schemas";
import { TagListInput } from "./TagListInput";

const COMPANY_SIZES = [
  "startup (<50)",
  "scaleup (50-500)",
  "mid-size (500-5000)",
  "enterprise (5000+)",
];

export function IjpEditor({
  initial,
  version,
}: {
  initial: IjpData;
  version: number;
}) {
  const router = useRouter();
  const [data, setData] = useState<IjpData>(initial);
  const [skillDraft, setSkillDraft] = useState("");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(patch: Partial<IjpData>) {
    setData((prev) => ({ ...prev, ...patch }));
    setDirty(true);
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/ijp", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Save failed");
      setDirty(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  function addSkill(priority: IjpSkill["priority"]) {
    const name = skillDraft.trim();
    if (!name) return;
    if (!data.skills.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
      update({ skills: [...data.skills, { name, priority }] });
    }
    setSkillDraft("");
  }

  const inputCls =
    "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none";
  const labelCls = "block text-sm font-medium text-slate-700";

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">
          Profile document{" "}
          <span className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-xs font-normal text-slate-500">
            v{version}
          </span>
        </h2>
        <div className="flex items-center gap-3">
          {error && <span className="text-sm text-red-600">{error}</span>}
          {dirty && !error && (
            <span className="text-xs text-amber-600">unsaved changes</span>
          )}
          <button
            onClick={save}
            disabled={!dirty || saving}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>

      <div className="mt-5 space-y-5">
        <TagListInput
          label="Target roles"
          values={data.targetRoles}
          onChange={(v) => update({ targetRoles: v })}
          placeholder="Add a role…"
        />
        <TagListInput
          label="Industries"
          values={data.industries}
          onChange={(v) => update({ industries: v })}
          placeholder="Add an industry…"
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Seniority</label>
            <input
              value={data.seniority}
              onChange={(e) => update({ seniority: e.target.value })}
              className={`${inputCls} mt-1`}
            />
          </div>
          <div>
            <label className={labelCls}>Remote preference</label>
            <select
              value={data.remotePreference}
              onChange={(e) =>
                update({
                  remotePreference: e.target
                    .value as IjpData["remotePreference"],
                })
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
            <label className={labelCls}>Compensation floor (annual base)</label>
            <div className="mt-1 flex gap-2">
              <input
                value={data.compensationFloor ?? ""}
                onChange={(e) => {
                  const n = parseInt(
                    e.target.value.replace(/[^0-9]/g, ""),
                    10,
                  );
                  update({
                    compensationFloor: Number.isFinite(n) ? n : null,
                  });
                }}
                placeholder="e.g. 140000"
                className={inputCls}
              />
              <input
                value={data.compensationCurrency}
                onChange={(e) =>
                  update({ compensationCurrency: e.target.value })
                }
                className={`${inputCls} w-20`}
              />
            </div>
          </div>
        </div>

        <TagListInput
          label="Locations"
          values={data.locations}
          onChange={(v) => update({ locations: v })}
          placeholder="Add a location…"
        />

        <div>
          <label className={labelCls}>Company size preference</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {COMPANY_SIZES.map((size) => {
              const checked = data.companySizePreference.includes(size);
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() =>
                    update({
                      companySizePreference: checked
                        ? data.companySizePreference.filter((s) => s !== size)
                        : [...data.companySizePreference, size],
                    })
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

        <TagListInput
          label="Dealbreakers"
          values={data.dealbreakers}
          onChange={(v) => update({ dealbreakers: v })}
          placeholder="Add a dealbreaker…"
        />

        <div>
          <label className={labelCls}>
            Skills{" "}
            <span className="font-normal text-slate-400">
              (drive job matching — click a skill to toggle must/nice)
            </span>
          </label>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {data.skills.map((skill) => (
              <span
                key={skill.name}
                className={`inline-flex cursor-pointer items-center gap-1 rounded-full border px-2.5 py-1 text-xs ${
                  skill.priority === "must"
                    ? "border-indigo-300 bg-indigo-50 text-indigo-800"
                    : "border-slate-200 bg-slate-50 text-slate-600"
                }`}
                title="Click to toggle must/nice"
                onClick={() =>
                  update({
                    skills: data.skills.map((s) =>
                      s.name === skill.name
                        ? {
                            ...s,
                            priority: s.priority === "must" ? "nice" : "must",
                          }
                        : s,
                    ),
                  })
                }
              >
                <span className="font-medium">{skill.name}</span>
                <span className="text-[10px] uppercase opacity-60">
                  {skill.priority}
                </span>
                <button
                  type="button"
                  aria-label={`Remove ${skill.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    update({
                      skills: data.skills.filter(
                        (s) => s.name !== skill.name,
                      ),
                    });
                  }}
                  className="text-slate-400 hover:text-slate-700"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <input
              value={skillDraft}
              onChange={(e) => setSkillDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSkill("must");
                }
              }}
              placeholder="Add a skill…"
              className={`${inputCls} max-w-60`}
            />
            <button
              type="button"
              onClick={() => addSkill("must")}
              className="rounded-md border border-indigo-300 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
            >
              + must-have
            </button>
            <button
              type="button"
              onClick={() => addSkill("nice")}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              + nice-to-have
            </button>
          </div>
        </div>

        <div>
          <label className={labelCls}>Notes</label>
          <textarea
            value={data.notes}
            onChange={(e) => update({ notes: e.target.value })}
            rows={3}
            className={`${inputCls} mt-1`}
          />
        </div>
      </div>
    </div>
  );
}
