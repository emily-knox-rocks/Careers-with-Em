// Small display atoms shared by the jobs table and detail page. Tooltips are
// pure CSS (group-hover) so hover-justifications work without a library —
// mirroring Metaview's hover-for-reasoning pattern.

const RANK_STYLES: Record<string, string> = {
  great: "bg-emerald-100 text-emerald-800 border-emerald-300",
  good: "bg-sky-100 text-sky-800 border-sky-300",
  okay: "bg-amber-100 text-amber-800 border-amber-300",
  poor: "bg-red-100 text-red-700 border-red-300",
};

export function RankBadge({
  overall,
  justification,
  stale,
}: {
  overall: string | null;
  justification?: string;
  stale?: boolean;
}) {
  if (!overall) {
    return (
      <span className="inline-block rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-400">
        unranked
      </span>
    );
  }
  return (
    <span className="group relative inline-block">
      <span
        className={`inline-block cursor-help rounded border px-2 py-0.5 text-xs font-semibold capitalize ${RANK_STYLES[overall] ?? "bg-slate-100 text-slate-600 border-slate-300"} ${stale ? "opacity-50" : ""}`}
      >
        {overall} fit{stale ? " *" : ""}
      </span>
      {justification && (
        <span className="pointer-events-none absolute left-0 top-full z-30 mt-1 hidden w-72 rounded-md border border-slate-200 bg-white p-2.5 text-xs font-normal normal-case leading-snug text-slate-700 shadow-lg group-hover:block">
          {stale && (
            <span className="mb-1 block font-medium text-amber-600">
              Scored against an older profile version — re-rank to refresh.
            </span>
          )}
          {justification}
        </span>
      )}
    </span>
  );
}

const FIT_STYLES: Record<string, string> = {
  strong: "bg-emerald-500",
  partial: "bg-amber-400",
  weak: "bg-red-400",
  missing: "bg-slate-300",
};

export function FitChip({
  fit,
  note,
  label,
}: {
  fit: string;
  note?: string;
  label?: string;
}) {
  return (
    <span className="group relative inline-flex items-center gap-1">
      <span
        className={`inline-block h-2.5 w-2.5 cursor-help rounded-full ${FIT_STYLES[fit] ?? "bg-slate-200"}`}
      />
      <span className="text-xs capitalize text-slate-600">{fit}</span>
      {note && (
        <span className="pointer-events-none absolute left-0 top-full z-30 mt-1 hidden w-64 rounded-md border border-slate-200 bg-white p-2.5 text-xs leading-snug text-slate-700 shadow-lg group-hover:block">
          {label && (
            <span className="mb-0.5 block font-medium text-slate-900">
              {label}
            </span>
          )}
          {note}
        </span>
      )}
    </span>
  );
}
