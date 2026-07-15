import { prisma } from "@/lib/prisma";
import { getLocalUser } from "@/lib/user";
import {
  ApplicationsTable,
  type ApplicationRowView,
} from "@/components/applications/ApplicationsTable";
import { NewApplicationForm } from "@/components/applications/NewApplicationForm";
import { TouchpointForm } from "@/components/applications/TouchpointForm";

export const dynamic = "force-dynamic";

export default async function ApplicationsPage() {
  const user = await getLocalUser();
  const [applications, jobs, resumes, touchpoints] = await Promise.all([
    prisma.application.findMany({
      where: { userId: user.id },
      include: { jobPost: { include: { bucket: true } }, resume: true },
      orderBy: { appliedAt: "desc" },
    }),
    prisma.jobPost.findMany({
      where: { userId: user.id, archived: false },
      orderBy: { title: "asc" },
      select: { id: true, title: true, company: true },
    }),
    prisma.resume.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, label: true },
    }),
    prisma.touchpoint.findMany({
      where: { userId: user.id },
      orderBy: { occurredAt: "desc" },
      take: 8,
    }),
  ]);

  const trackedJobIds = new Set(applications.map((a) => a.jobPostId));
  const rows: ApplicationRowView[] = applications.map((a) => ({
    id: a.id,
    jobId: a.jobPostId,
    jobTitle: a.jobPost.title,
    company: a.jobPost.company,
    bucketName: a.jobPost.bucket?.name ?? null,
    resumeLabel: a.resume.label,
    appliedAt: a.appliedAt.toISOString(),
    stage: a.stage,
    notes: a.notes,
  }));

  return (
    <div>
      <h1 className="text-2xl font-semibold">Applications</h1>
      <p className="mt-1 text-sm text-slate-600">
        Each application records the job, its bucket, and the resume version
        you used — the dashboards read response rates from exactly this.
      </p>

      <div className="mt-5 space-y-5">
        <ApplicationsTable rows={rows} />
        {resumes.length === 0 ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Add a resume version first (Resumes page) — applications track
            which version you applied with.
          </div>
        ) : (
          <NewApplicationForm
            jobs={jobs
              .filter((j) => !trackedJobIds.has(j.id))
              .map((j) => ({ id: j.id, label: `${j.title} — ${j.company}` }))}
            resumes={resumes}
          />
        )}
        <TouchpointForm />
        {touchpoints.length > 0 && (
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-700">
              Recent touchpoints
            </h2>
            <ul className="mt-2 divide-y divide-slate-100">
              {touchpoints.map((t) => (
                <li key={t.id} className="flex items-baseline gap-3 py-1.5 text-xs">
                  <span className="w-20 shrink-0 text-slate-400">
                    {t.occurredAt.toLocaleDateString()}
                  </span>
                  <span className="font-medium text-slate-700">
                    {t.contactName}
                  </span>
                  {t.company && <span className="text-slate-500">{t.company}</span>}
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">
                    {t.channel}
                  </span>
                  {t.notes && (
                    <span className="truncate text-slate-400">{t.notes}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
