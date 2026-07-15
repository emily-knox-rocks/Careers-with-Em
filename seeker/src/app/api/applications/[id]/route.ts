import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getLocalUser } from "@/lib/user";
import { STAGES } from "@/lib/stages";

const BodySchema = z.object({
  stage: z.enum(STAGES).optional(),
  notes: z.string().max(2000).optional(),
  resumeId: z.string().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update" }, { status: 400 });
  }
  const user = await getLocalUser();
  const app = await prisma.application.findUnique({ where: { id } });
  if (!app || app.userId !== user.id) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  const { stage, notes, resumeId } = parsed.data;
  const updated = await prisma.application.update({
    where: { id },
    data: {
      ...(notes !== undefined ? { notes } : {}),
      ...(resumeId ? { resumeId } : {}),
      ...(stage && stage !== app.stage
        ? { stage, stageEvents: { create: { stage } } }
        : {}),
    },
  });
  return NextResponse.json({ application: updated });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getLocalUser();
  const app = await prisma.application.findUnique({ where: { id } });
  if (!app || app.userId !== user.id) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }
  await prisma.application.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
