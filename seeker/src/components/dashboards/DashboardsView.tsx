"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { FUNNEL_STAGES } from "@/lib/stages";

// Single-hue charts (identity lives in row labels, not color), thin marks,
// rounded value-ends, recessive grid — per the dataviz method.
const SERIES = "#2a78d6";
const GRID = "#e2e8f0";
const INK_MUTED = "#64748b";

export type AppDatum = {
  id: string;
  bucketName: string | null;
  resumeLabel: string;
  appliedAt: string;
  stage: string;
  reached: string[]; // funnel stages this application ever reached
};

export type TouchDatum = { occurredAt: string; channel: string };

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

// All-UTC so a week key never straddles the viewer's timezone — mixing local
// getDay with UTC toISOString made touchpoints vanish from the chart.
function weekStart(iso: string): string {
  const d = new Date(iso);
  const day = (d.getUTCDay() + 6) % 7; // Monday = 0
  d.setUTCDate(d.getUTCDate() - day);
  return d.toISOString().slice(0, 10);
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
      {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Empty({ hint }: { hint: string }) {
  return (
    <div className="flex h-48 items-center justify-center text-xs text-slate-400">
      {hint}
    </div>
  );
}

const tooltipStyle = {
  fontSize: 12,
  borderRadius: 8,
  border: `1px solid ${GRID}`,
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
};

function HBarChart({
  data,
  valueSuffix,
}: {
  data: { name: string; value: number; detail?: string }[];
  valueSuffix?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(160, data.length * 44)}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 40 }}>
        <CartesianGrid horizontal={false} stroke={GRID} strokeDasharray="2 4" />
        <XAxis
          type="number"
          allowDecimals={false}
          tick={{ fontSize: 11, fill: INK_MUTED }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={150}
          tick={{ fontSize: 11, fill: "#334155" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(value) => [`${value}${valueSuffix ?? ""}`, ""]}
          labelFormatter={(label, payload) =>
            payload?.[0]?.payload?.detail ?? label
          }
          cursor={{ fill: "rgba(42,120,214,0.06)" }}
        />
        <Bar
          dataKey="value"
          fill={SERIES}
          barSize={16}
          radius={[0, 4, 4, 0]}
          label={{
            position: "right",
            fontSize: 11,
            fill: "#334155",
            formatter: (v: unknown) => `${v}${valueSuffix ?? ""}`,
          }}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DashboardsView({
  apps,
  touchpoints,
  buckets,
}: {
  apps: AppDatum[];
  touchpoints: TouchDatum[];
  buckets: string[];
}) {
  const [bucket, setBucket] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const inRange = (iso: string) =>
    (!from || iso >= from) && (!to || iso <= to + "T23:59:59Z");

  const filteredApps = useMemo(
    () =>
      apps.filter(
        (a) =>
          (bucket === "all" || a.bucketName === bucket) && inRange(a.appliedAt),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [apps, bucket, from, to],
  );
  const filteredTouch = useMemo(
    () => touchpoints.filter((t) => inRange(t.occurredAt)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [touchpoints, from, to],
  );

  // ---- aggregations -------------------------------------------------------
  const responded = (a: AppDatum) => a.reached.includes("screen");

  const byResume = useMemo(() => {
    const groups = new Map<string, AppDatum[]>();
    for (const a of filteredApps) {
      groups.set(a.resumeLabel, [...(groups.get(a.resumeLabel) ?? []), a]);
    }
    return [...groups.entries()].map(([name, list]) => ({
      name,
      value: pct(list.filter(responded).length, list.length),
      detail: `${name}: ${list.filter(responded).length}/${list.length} applications got a response`,
    }));
  }, [filteredApps]);

  const byBucket = useMemo(() => {
    const groups = new Map<string, AppDatum[]>();
    for (const a of filteredApps) {
      const key = a.bucketName ?? "(no bucket)";
      groups.set(key, [...(groups.get(key) ?? []), a]);
    }
    return [...groups.entries()].map(([name, list]) => ({
      name,
      value: pct(list.filter(responded).length, list.length),
      detail: `${name}: ${list.filter(responded).length}/${list.length} applications got a response`,
    }));
  }, [filteredApps]);

  const funnel = useMemo(
    () =>
      FUNNEL_STAGES.map((stage) => {
        const count = filteredApps.filter((a) =>
          a.reached.includes(stage),
        ).length;
        return {
          name: stage,
          value: count,
          detail: `${count} of ${filteredApps.length} applications reached ${stage} (${pct(count, filteredApps.length)}%)`,
        };
      }),
    [filteredApps],
  );

  const outcomes = useMemo(() => {
    const interviewed = filteredApps.filter((a) =>
      a.reached.includes("interview"),
    );
    // rows are mutually exclusive so they sum to the stated total
    const rows = [
      ["offer", interviewed.filter((a) => a.reached.includes("offer")).length],
      ["rejected", interviewed.filter((a) => !a.reached.includes("offer") && a.stage === "rejected").length],
      ["ghosted", interviewed.filter((a) => !a.reached.includes("offer") && a.stage === "ghosted").length],
      ["in process", interviewed.filter((a) => !a.reached.includes("offer") && !["rejected", "ghosted"].includes(a.stage)).length],
    ] as const;
    return {
      total: interviewed.length,
      data: rows.map(([name, value]) => ({
        name,
        value,
        detail: `${value} of ${interviewed.length} interviewed applications: ${name}`,
      })),
    };
  }, [filteredApps]);

  const touchByWeek = useMemo(() => {
    if (filteredTouch.length === 0) return [];
    const counts = new Map<string, number>();
    for (const t of filteredTouch) {
      const wk = weekStart(t.occurredAt);
      counts.set(wk, (counts.get(wk) ?? 0) + 1);
    }
    const weeks = [...counts.keys()].sort();
    // fill empty weeks between first and last so gaps are visible
    const out: { name: string; value: number }[] = [];
    const cursor = new Date(weeks[0]);
    const end = new Date(weeks[weeks.length - 1]);
    while (cursor <= end) {
      const key = cursor.toISOString().slice(0, 10);
      out.push({ name: key.slice(5), value: counts.get(key) ?? 0 });
      cursor.setDate(cursor.getDate() + 7);
    }
    return out;
  }, [filteredTouch]);

  const tiles = [
    { label: "Applications", value: filteredApps.length },
    {
      label: "Response rate",
      value: `${pct(filteredApps.filter(responded).length, filteredApps.length)}%`,
    },
    {
      label: "Interviews",
      value: filteredApps.filter((a) => a.reached.includes("interview")).length,
    },
    {
      label: "Offers",
      value: filteredApps.filter((a) => a.reached.includes("offer")).length,
    },
    { label: "Touchpoints", value: filteredTouch.length },
  ];

  const inputCls =
    "rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs focus:border-indigo-500 focus:outline-none";

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={bucket}
          onChange={(e) => setBucket(e.target.value)}
          className={inputCls}
        >
          <option value="all">All buckets</option>
          {buckets.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        <label className="text-xs text-slate-500">from</label>
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className={inputCls}
        />
        <label className="text-xs text-slate-500">to</label>
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className={inputCls}
        />
        {(from || to || bucket !== "all") && (
          <button
            onClick={() => {
              setBucket("all");
              setFrom("");
              setTo("");
            }}
            className="text-xs font-medium text-indigo-600 hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {tiles.map((tile) => (
          <div
            key={tile.label}
            className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
          >
            <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              {tile.label}
            </div>
            <div className="mt-0.5 text-2xl font-semibold text-slate-900">
              {tile.value}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
        <ChartCard
          title="Response rate by resume version"
          subtitle="% of applications that reached at least a recruiter screen"
        >
          {byResume.length === 0 ? (
            <Empty hint="No applications in this range." />
          ) : (
            <HBarChart data={byResume} valueSuffix="%" />
          )}
        </ChartCard>

        <ChartCard
          title="Response rate by bucket"
          subtitle="% of applications that reached at least a recruiter screen"
        >
          {byBucket.length === 0 ? (
            <Empty hint="No applications in this range." />
          ) : (
            <HBarChart data={byBucket} valueSuffix="%" />
          )}
        </ChartCard>

        <ChartCard
          title="Stage conversion funnel"
          subtitle="applications that ever reached each stage"
        >
          {filteredApps.length === 0 ? (
            <Empty hint="No applications in this range." />
          ) : (
            <HBarChart data={funnel} />
          )}
        </ChartCard>

        <ChartCard
          title="Interview outcomes"
          subtitle={`of ${outcomes.total} application${outcomes.total === 1 ? "" : "s"} that reached interview`}
        >
          {outcomes.total === 0 ? (
            <Empty hint="No interviews in this range yet." />
          ) : (
            <HBarChart data={outcomes.data} />
          )}
        </ChartCard>

        <ChartCard
          title="Networking touchpoints over time"
          subtitle="touchpoints per week"
        >
          {touchByWeek.length === 0 ? (
            <Empty hint="No touchpoints logged in this range." />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={touchByWeek} margin={{ right: 12 }}>
                <CartesianGrid vertical={false} stroke={GRID} strokeDasharray="2 4" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: INK_MUTED }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: INK_MUTED }}
                  axisLine={false}
                  tickLine={false}
                  width={24}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v) => [`${v} touchpoints`, ""]}
                  labelFormatter={(l) => `week of ${l}`}
                  cursor={{ fill: "rgba(42,120,214,0.06)" }}
                />
                <Bar dataKey="value" fill={SERIES} barSize={18} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
