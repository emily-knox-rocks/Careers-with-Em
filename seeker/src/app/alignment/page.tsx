import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getLocalUser } from "@/lib/user";
import {
  AlignmentView,
  type RecommendationView,
} from "@/components/alignment/AlignmentView";

export const dynamic = "force-dynamic";

export default async function AlignmentPage() {
  const user = await getLocalUser();
  const [buckets, resumes, pending] = await Promise.all([
    prisma.bucket.findMany({
      where: { userId: user.id },
      include: { _count: { select: { jobPosts: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.resume.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, label: true },
    }),
    prisma.resumeRecommendation.findMany({
      where: { status: "pending", resume: { userId: user.id } },
      include: { bucket: true, resume: { select: { label: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (resumes.length === 0 || buckets.length === 0) {
    return (
      <div className="max-w-xl">
        <h1 className="text-2xl font-semibold">Resume alignment</h1>
        <p className="mt-2 text-sm text-slate-600">
          Alignment compares a resume version against the job descriptions in
          a bucket. You need at least one resume version and one bucket with
          jobs.
        </p>
        <div className="mt-4 flex gap-3">
          <Link href="/resumes" className="text-sm font-medium text-indigo-600 hover:underline">
            Manage resumes →
          </Link>
          <Link href="/jobs" className="text-sm font-medium text-indigo-600 hover:underline">
            Manage jobs →
          </Link>
        </div>
      </div>
    );
  }

  const recommendations: RecommendationView[] = pending.map((r) => ({
    id: r.id,
    bucketName: r.bucket.name,
    resumeLabel: r.resume.label,
    type: r.type,
    lineNumber: r.lineNumber,
    currentText: r.currentText,
    suggestedText: r.suggestedText,
    reason: r.reason,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-semibold">Resume alignment</h1>
      <p className="mt-1 text-sm text-slate-600">
        Line-level edit recommendations per bucket, each with the reason it
        improves alignment. Your stored resume changes only when you accept an
        edit.
      </p>
      <div className="mt-5">
        <AlignmentView
          buckets={buckets.map((b) => ({
            id: b.id,
            name: b.name,
            jobCount: b._count.jobPosts,
          }))}
          resumes={resumes}
          recommendations={recommendations}
        />
      </div>
    </div>
  );
}
