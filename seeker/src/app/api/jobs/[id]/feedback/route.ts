import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getLocalUser } from "@/lib/user";

const BodySchema = z.object({
  verdict: z.enum(["yes", "maybe", "no"]),
  reason: z.string().max(500).default(""),
});

// Yes/maybe/no + one-line reason on a job card. Feeds the IJP suggestion loop.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "verdict must be yes/maybe/no; reason max 500 chars" },
      { status: 400 },
    );
  }
  const user = await getLocalUser();
  const job = await prisma.jobPost.findUnique({ where: { id } });
  if (!job || job.userId !== user.id) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }
  const feedback = await prisma.jobFeedback.create({
    data: { jobPostId: id, ...parsed.data },
  });
  const unconsumed = await prisma.jobFeedback.count({
    where: { consumedAt: null, jobPost: { userId: user.id } },
  });
  return NextResponse.json({ feedback, unconsumed });
}
