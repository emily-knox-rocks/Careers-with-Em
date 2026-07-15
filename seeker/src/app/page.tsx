import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getLocalUser } from "@/lib/user";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getLocalUser();
  const [ijp, jobCount, appCount, pendingSuggestions, callCount] =
    await Promise.all([
      prisma.idealJobProfile.findUnique({ where: { userId: user.id } }),
      prisma.jobPost.count({ where: { userId: user.id, archived: false } }),
      prisma.application.count({ where: { userId: user.id } }),
      prisma.ijpSuggestion.count({
        where: { userId: user.id, status: "pending" },
      }),
      prisma.callNote.count({ where: { userId: user.id } }),
    ]);

  const cards = [
    {
      href: "/ijp",
      title: "Ideal Job Profile",
      value: ijp ? `v${ijp.version}` : "not set up",
      hint: ijp
        ? pendingSuggestions > 0
          ? `${pendingSuggestions} suggestion${pendingSuggestions === 1 ? "" : "s"} awaiting review`
          : "up to date"
        : "draft it from your resume",
    },
    {
      href: "/jobs",
      title: "Jobs",
      value: String(jobCount),
      hint: "ranked against your IJP",
    },
    {
      href: "/applications",
      title: "Applications",
      value: String(appCount),
      hint: "tracked across stages",
    },
    {
      href: "/calls",
      title: "Calls",
      value: String(callCount),
      hint: "summarized with citations",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold">
        Welcome back, {user.name.split(" ")[0]}
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        Seeker mirrors a recruiter&apos;s agent stack for your side of the
        table: a living profile, ranked jobs, a tracker, resume alignment, and
        a notetaker.
      </p>
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="text-sm font-medium text-slate-500">
              {card.title}
            </div>
            <div className="mt-1 text-2xl font-semibold">{card.value}</div>
            <div className="mt-1 text-xs text-slate-500">{card.hint}</div>
          </Link>
        ))}
      </div>
      {!ijp && (
        <div className="mt-8 rounded-lg border border-indigo-200 bg-indigo-50 p-5">
          <h2 className="font-medium text-indigo-900">Start here</h2>
          <p className="mt-1 text-sm text-indigo-800">
            Everything in Seeker keys off your Ideal Job Profile. Draft it from
            your resume and a short intake — you stay in control of every
            field.
          </p>
          <Link
            href="/ijp/new"
            className="mt-3 inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Create your IJP
          </Link>
        </div>
      )}
    </div>
  );
}
