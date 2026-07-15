import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLocalUser } from "@/lib/user";

// Options for the new-call form: attachable jobs and resume versions.
export async function GET() {
  const user = await getLocalUser();
  const [jobs, resumes] = await Promise.all([
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
  ]);
  return NextResponse.json({
    jobs: jobs.map((j) => ({ id: j.id, label: `${j.title} — ${j.company}` })),
    resumes,
  });
}
