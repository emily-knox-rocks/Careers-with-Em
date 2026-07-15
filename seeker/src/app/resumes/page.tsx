import { prisma } from "@/lib/prisma";
import { getLocalUser } from "@/lib/user";
import {
  ResumeManager,
  type ResumeView,
} from "@/components/resumes/ResumeManager";

export const dynamic = "force-dynamic";

export default async function ResumesPage() {
  const user = await getLocalUser();
  const resumes = await prisma.resume.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { applications: true } } },
  });

  const views: ResumeView[] = resumes.map((r) => ({
    id: r.id,
    label: r.label,
    content: r.content,
    createdAt: r.createdAt.toISOString(),
    applicationCount: r._count.applications,
  }));

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-semibold">Resumes</h1>
      <p className="mt-1 text-sm text-slate-600">
        Keep one version per angle (coaching-heavy, recruiting-heavy, …).
        Applications record which version you used, and the Alignment page
        recommends edits per bucket.
      </p>
      <div className="mt-5">
        <ResumeManager resumes={views} />
      </div>
    </div>
  );
}
