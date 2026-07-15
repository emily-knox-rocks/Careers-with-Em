import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getLocalUser } from "@/lib/user";

export const dynamic = "force-dynamic";

const TEMPLATE_LABELS: Record<string, string> = {
  recruiter_screen: "Recruiter screen",
  hiring_manager: "Hiring manager",
  networking: "Networking",
};

export default async function CallsPage() {
  const user = await getLocalUser();
  const calls = await prisma.callNote.findMany({
    where: { userId: user.id },
    include: { jobPost: { select: { title: true, company: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Calls</h1>
          <p className="mt-1 text-sm text-slate-600">
            Upload a transcript after each interview or networking call —
            Seeker writes the structured summary, with citations back to the
            transcript.
          </p>
        </div>
        <Link
          href="/calls/new"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + New call
        </Link>
      </div>

      {calls.length === 0 ? (
        <div className="mt-6 rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
          No calls yet. After your next interview or networking chat, upload
          the transcript here.
        </div>
      ) : (
        <div className="mt-5 space-y-2">
          {calls.map((call) => (
            <Link
              key={call.id}
              href={`/calls/${call.id}`}
              className="block rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-slate-900">
                    {call.title}
                  </span>
                  <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                    {TEMPLATE_LABELS[call.template] ?? call.template}
                  </span>
                  {call.jobPost && (
                    <span className="ml-2 text-xs text-slate-500">
                      {call.jobPost.title} @ {call.jobPost.company}
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-400">
                  {call.createdAt.toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
