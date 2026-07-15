import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getLocalUser } from "@/lib/user";
import { applyRecommendationToResume } from "@/lib/ai/align";

const BodySchema = z.object({ action: z.enum(["accept", "reject"]) });

// Review-queue resolution: the stored resume changes ONLY here, on accept.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "action must be accept or reject" },
      { status: 400 },
    );
  }
  const user = await getLocalUser();
  const rec = await prisma.resumeRecommendation.findUnique({
    where: { id },
    include: { resume: true },
  });
  if (!rec || rec.resume.userId !== user.id) {
    return NextResponse.json({ error: "Recommendation not found" }, { status: 404 });
  }
  if (rec.status !== "pending") {
    return NextResponse.json(
      { error: `Recommendation already ${rec.status}` },
      { status: 409 },
    );
  }

  if (parsed.data.action === "reject") {
    const updated = await prisma.resumeRecommendation.update({
      where: { id },
      data: { status: "rejected", resolvedAt: new Date() },
    });
    return NextResponse.json({ recommendation: updated });
  }

  const applied = applyRecommendationToResume(rec.resume.content, rec);
  if (!applied.ok) {
    return NextResponse.json({ error: applied.error }, { status: 409 });
  }

  const [, updated] = await prisma.$transaction([
    prisma.resume.update({
      where: { id: rec.resumeId },
      data: { content: applied.content },
    }),
    prisma.resumeRecommendation.update({
      where: { id },
      data: { status: "accepted", resolvedAt: new Date() },
    }),
  ]);

  return NextResponse.json({ recommendation: updated });
}
