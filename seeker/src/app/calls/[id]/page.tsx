import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getLocalUser } from "@/lib/user";
import { parseJson } from "@/lib/jsonField";
import type { CallSummary } from "@/lib/ai/schemas";
import { CallSummaryView } from "@/components/calls/CallSummaryView";

export const dynamic = "force-dynamic";

export default async function CallDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getLocalUser();
  const call = await prisma.callNote.findUnique({
    where: { id },
    include: {
      jobPost: { select: { title: true, company: true } },
      resume: { select: { label: true } },
    },
  });
  if (!call || call.userId !== user.id) notFound();

  const summary = parseJson<CallSummary | null>(call.summary, null);

  return (
    <div>
      <Link href="/calls" className="text-xs text-slate-500 hover:underline">
        ← Back to calls
      </Link>
      <div className="mt-2">
        <h1 className="text-2xl font-semibold">{call.title}</h1>
        <p className="mt-0.5 text-xs text-slate-400">
          {call.createdAt.toLocaleString()}
          {call.jobPost &&
            ` · JD source: ${call.jobPost.title} @ ${call.jobPost.company}`}
          {call.resume && ` · resume source: ${call.resume.label}`}
        </p>
      </div>
      <div className="mt-5">
        {summary ? (
          <CallSummaryView
            callId={call.id}
            template={call.template}
            summary={summary}
            transcript={call.transcript}
            engine={call.engine}
          />
        ) : (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            The stored summary could not be parsed — use Regenerate on the
            call to rebuild it.
          </div>
        )}
      </div>
    </div>
  );
}
