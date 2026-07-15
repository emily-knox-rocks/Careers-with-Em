"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { JobRowView } from "./types";
import { RankBadge, FitChip } from "./badges";
import { FeedbackControl } from "./FeedbackControl";

const RANK_VALUE: Record<string, number> = { great: 3, good: 2, okay: 1, poor: 0 };
const FIT_VALUE: Record<string, number> = { strong: 3, partial: 2, weak: 1, missing: 0 };

type SortKey =
  | "overall"
  | "skills"
  | "seniority"
  | "comp"
  | "location"
  | `skill:${string}`;

export function JobsTable({
  rows,
  buckets,
  mustSkills,
  staleCount,
  unconsumedFeedback,
}: {
  rows: JobRowView[];
  buckets: { id: string; name: string }[];
  mustSkills: string[];
  staleCount: number;
  unconsumedFeedback: number;
}) {
  const router = useRouter();
  const [sortKey, setSortKey] = useState<SortKey>("overall");
  const [sortDir, setSortDir] = useState<1 | -1>(-1);
  const [bucketFilter, setBucketFilter] = useState("all");
  const [rankFilter, setRankFilter] = useState("all");
  const [verdictFilter, setVerdictFilter] = useState("all");
  const [showSkillCols, setShowSkillCols] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function sortValue(row: JobRowView, key: SortKey): number {
    if (key === "overall")
      return row.overall != null ? RANK_VALUE[row.overall] ?? -1 : -1;
    if (key === "skills" || key === "seniority" || key === "comp" || key === "location")
      return row.dims ? FIT_VALUE[row.dims[key].fit] ?? -1 : -1;
    if (key.startsWith("skill:")) {
      const skill = key.slice(6);
      const lv = row.skillLevels[skill]?.level;
      return lv ? FIT_VALUE[lv] ?? -1 : -1;
    }
    return 0;
  }

  const visible = useMemo(() => {
    let out = rows;
    if (bucketFilter !== "all")
      out = out.filter((r) => r.bucketName === bucketFilter);
    if (rankFilter !== "all") {
      const min = RANK_VALUE[rankFilter] ?? 0;
      out = out.filter(
        (r) => r.overall != null && (RANK_VALUE[r.overall] ?? -1) >= min,
      );
    }
    if (verdictFilter === "unreviewed") out = out.filter((r) => !r.feedback);
    else if (verdictFilter !== "all")
      out = out.filter((r) => r.feedback?.verdict === verdictFilter);
    return [...out].sort(
      (a, b) => (sortValue(a, sortKey) - sortValue(b, sortKey)) * sortDir,
    );
  }, [rows, bucketFilter, rankFilter, verdictFilter, sortKey, sortDir]);

  function clickSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 1 ? -1 : 1));
    else {
      setSortKey(key);
      setSortDir(-1);
    }
  }

  async function rankAll() {
    setBusy("rank");
    setNotice(null);
    try {
      const res = await fetch("/api/jobs/rank", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Ranking failed");
      setNotice(`Ranked ${data.ranked} jobs against IJP v${data.ijpVersion} (${data.engine}).`);
      router.refresh();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  }

  async function suggest() {
    setBusy("suggest");
    setNotice(null);
    try {
      const res = await fetch("/api/ijp/suggest", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Suggestion run failed");
      setNotice(
        data.created > 0
          ? `Agent proposed ${data.created} profile update${data.created === 1 ? "" : "s"} from ${data.consumed} feedback items — review them on the IJP page.`
          : `Read ${data.consumed} feedback items — no profile changes to suggest yet.`,
      );
      router.refresh();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  }

  const th =
    "px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 select-none cursor-pointer whitespace-nowrap";
  const sortArrow = (key: SortKey) =>
    sortKey === key ? (sortDir === -1 ? " ↓" : " ↑") : "";

  return (
    <div>
      {(staleCount > 0 || unconsumedFeedback >= 3) && (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          {staleCount > 0 && (
            <div className="flex items-center gap-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              <span>
                {staleCount} job{staleCount === 1 ? "" : "s"} unranked or ranked
                against an older profile version.
              </span>
              <button
                onClick={rankAll}
                disabled={busy !== null}
                className="rounded bg-amber-600 px-3 py-1 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-50"
              >
                {busy === "rank" ? "Ranking…" : "Rank now"}
              </button>
            </div>
          )}
          {unconsumedFeedback >= 3 && (
            <div className="flex items-center gap-3 rounded-md border border-indigo-300 bg-indigo-50 px-3 py-2 text-sm text-indigo-900">
              <span>
                {unconsumedFeedback} new feedback items since the last profile
                update.
              </span>
              <button
                onClick={suggest}
                disabled={busy !== null}
                className="rounded bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {busy === "suggest" ? "Analyzing…" : "Update profile from feedback"}
              </button>
            </div>
          )}
        </div>
      )}
      {notice && (
        <div className="mb-4 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700">
          {notice}{" "}
          {notice.includes("review them") && (
            <Link href="/ijp" className="font-medium text-indigo-600 underline">
              Open IJP →
            </Link>
          )}
        </div>
      )}

      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
        <select
          value={bucketFilter}
          onChange={(e) => setBucketFilter(e.target.value)}
          className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs"
        >
          <option value="all">All buckets</option>
          {buckets.map((b) => (
            <option key={b.id} value={b.name}>
              {b.name}
            </option>
          ))}
        </select>
        <select
          value={rankFilter}
          onChange={(e) => setRankFilter(e.target.value)}
          className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs"
        >
          <option value="all">Any fit</option>
          <option value="great">Great only</option>
          <option value="good">Good or better</option>
          <option value="okay">Okay or better</option>
        </select>
        <select
          value={verdictFilter}
          onChange={(e) => setVerdictFilter(e.target.value)}
          className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs"
        >
          <option value="all">All feedback</option>
          <option value="unreviewed">Unreviewed</option>
          <option value="yes">Yes</option>
          <option value="maybe">Maybe</option>
          <option value="no">No</option>
        </select>
        <label className="ml-2 flex items-center gap-1.5 text-xs text-slate-600">
          <input
            type="checkbox"
            checked={showSkillCols}
            onChange={(e) => setShowSkillCols(e.target.checked)}
          />
          per-skill columns
        </label>
        <span className="ml-auto text-xs text-slate-400">
          {visible.length} of {rows.length} jobs
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className={th} onClick={() => clickSort("overall")}>
                Fit{sortArrow("overall")}
              </th>
              <th className={`${th} cursor-default`}>Role</th>
              <th className={th} onClick={() => clickSort("skills")}>
                Skills{sortArrow("skills")}
              </th>
              <th className={th} onClick={() => clickSort("seniority")}>
                Seniority{sortArrow("seniority")}
              </th>
              <th className={th} onClick={() => clickSort("comp")}>
                Comp{sortArrow("comp")}
              </th>
              <th className={th} onClick={() => clickSort("location")}>
                Location{sortArrow("location")}
              </th>
              {showSkillCols &&
                mustSkills.map((skill) => (
                  <th
                    key={skill}
                    className={`${th} border-l border-slate-100`}
                    onClick={() => clickSort(`skill:${skill}`)}
                    title={`IJP must-have skill: ${skill}`}
                  >
                    {skill}
                    {sortArrow(`skill:${skill}`)}
                  </th>
                ))}
              <th className={`${th} cursor-default`}>Feedback</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visible.map((row) => (
              <tr key={row.id} className="align-top hover:bg-slate-50/70">
                <td className="px-3 py-2.5">
                  <RankBadge
                    overall={row.overall}
                    justification={row.justification}
                    stale={row.stale}
                  />
                </td>
                <td className="max-w-64 px-3 py-2.5">
                  <Link
                    href={`/jobs/${row.id}`}
                    className="font-medium text-slate-900 hover:text-indigo-700 hover:underline"
                  >
                    {row.title}
                  </Link>
                  <div className="text-xs text-slate-500">
                    {row.company}
                    {row.comp && ` · ${row.comp}`}
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-400">
                    {[row.bucketName, row.location, row.remote]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                </td>
                {(["skills", "seniority", "comp", "location"] as const).map(
                  (dim) => (
                    <td key={dim} className="px-3 py-2.5">
                      {row.dims ? (
                        <FitChip
                          fit={row.dims[dim].fit}
                          note={row.dims[dim].note}
                          label={dim === "comp" ? "compensation" : dim}
                        />
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </td>
                  ),
                )}
                {showSkillCols &&
                  mustSkills.map((skill) => {
                    const lv = row.skillLevels[skill];
                    return (
                      <td
                        key={skill}
                        className="border-l border-slate-50 px-3 py-2.5"
                      >
                        {lv ? (
                          <FitChip fit={lv.level} note={lv.note} label={skill} />
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </td>
                    );
                  })}
                <td className="px-3 py-2.5">
                  <FeedbackControl jobId={row.id} current={row.feedback} />
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td
                  colSpan={7 + (showSkillCols ? mustSkills.length : 0)}
                  className="px-3 py-10 text-center text-sm text-slate-400"
                >
                  No jobs match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
