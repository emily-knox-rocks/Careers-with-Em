import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getLocalUser } from "@/lib/user";
import { parseJson } from "@/lib/jsonField";
import type { SkillBreakdownItem } from "@/lib/ai/schemas";
import { RankBadge, FitChip } from "@/components/jobs/badges";
import { FeedbackControl } from "@/components/jobs/FeedbackControl";

export const dynamic = "force-dynamic";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getLocalUser();
  const job = await prisma.jobPost.findUnique({
    where: { id },
    include: {
      bucket: true,
      scores: { orderBy: { ijpVersion: "desc" }, take: 1 },
      feedback: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!job || job.userId !== user.id) notFound();

  const ijpRow = await prisma.idealJobProfile.findUnique({
    where: { userId: user.id },
  });
  const score = job.scores[0] ?? null;
  const stale = score && ijpRow ? score.ijpVersion !== ijpRow.version : false;
  const breakdown = score
    ? parseJson<SkillBreakdownItem[]>(score.skillBreakdown, [])
    : [];
  const skills = parseJson<string[]>(job.skills, []);
  const latestFeedback = job.feedback[0] ?? null;

  const fmt = (n: number) => `$${n.toLocaleString()}`;
  const comp =
    job.compMin && job.compMax && job.compMin !== job.compMax
      ? `${fmt(job.compMin)} – ${fmt(job.compMax)}`
      : job.compMin || job.compMax
        ? fmt((job.compMin ?? job.compMax)!)
        : "not stated";

  return (
    <div className="max-w-5xl">
      <Link href="/jobs" className="text-xs text-slate-500 hover:underline">
        ← Back to jobs
      </Link>
      <div className="mt-2 flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold">{job.title}</h1>
          <p className="mt-0.5 text-sm text-slate-600">
            {job.company}
            {job.bucket && ` · ${job.bucket.name}`}
            {job.industry && ` · ${job.industry}`}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">
            {[job.location, job.remote, job.seniority, job.companySize, comp]
              .filter(Boolean)
              .join(" · ")}
            {job.url && (
              <>
                {" · "}
                <a
                  href={job.url}
                  className="text-indigo-600 hover:underline"
                  target="_blank"
                >
                  source ↗
                </a>
              </>
            )}
          </p>
        </div>
        <div className="text-right">
          <RankBadge
            overall={score?.overall ?? null}
            justification={score?.justification}
            stale={stale ?? false}
          />
          {score && (
            <div className="mt-1 text-[10px] text-slate-400">
              scored by {score.engine} · IJP v{score.ijpVersion}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Posting
          </h2>
          <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-800">
            {job.description}
          </pre>
        </div>

        <div className="space-y-5">
          {score && (
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Why this rank
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">
                {score.justification}
              </p>
              <div className="mt-4 space-y-2.5">
                {(
                  [
                    ["Skills", score.skillsFit, score.skillsNote],
                    ["Seniority", score.seniorityFit, score.seniorityNote],
                    ["Compensation", score.compFit, score.compNote],
                    ["Location", score.locationFit, score.locationNote],
                  ] as const
                ).map(([label, fit, note]) => (
                  <div key={label} className="flex items-start justify-between gap-3">
                    <span className="text-xs font-medium text-slate-600">
                      {label}
                    </span>
                    <FitChip fit={fit} note={note} label={label} />
                  </div>
                ))}
              </div>
              {breakdown.length > 0 && (
                <>
                  <h3 className="mt-5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Per-skill match
                  </h3>
                  <div className="mt-2 space-y-1.5">
                    {breakdown.map((item) => (
                      <div
                        key={item.skill}
                        className="flex items-start justify-between gap-3"
                      >
                        <span className="text-xs text-slate-600">
                          {item.skill}
                        </span>
                        <FitChip
                          fit={item.level}
                          note={item.note}
                          label={item.skill}
                        />
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Your verdict
            </h2>
            <div className="mt-3">
              <FeedbackControl
                jobId={job.id}
                current={
                  latestFeedback
                    ? {
                        verdict: latestFeedback.verdict,
                        reason: latestFeedback.reason,
                      }
                    : null
                }
              />
            </div>
            {job.feedback.length > 1 && (
              <div className="mt-4 border-t border-slate-100 pt-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  History
                </h3>
                <ul className="mt-1.5 space-y-1">
                  {job.feedback.slice(1).map((f) => (
                    <li key={f.id} className="text-xs text-slate-500">
                      <span className="font-medium capitalize">{f.verdict}</span>
                      {f.reason && ` — “${f.reason}”`}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {skills.length > 0 && (
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Skills the posting asks for
              </h2>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {skills.map((s) => (
                  <span
                    key={s}
                    className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
