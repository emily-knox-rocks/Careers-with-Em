import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLocalUser } from "@/lib/user";
import { ijpDataToRow, ijpRowToData } from "@/lib/ai/ijp";
import { IjpDataSchema } from "@/lib/ai/schemas";

export async function GET() {
  const user = await getLocalUser();
  const row = await prisma.idealJobProfile.findUnique({
    where: { userId: user.id },
  });
  if (!row) return NextResponse.json({ ijp: null });
  return NextResponse.json({
    ijp: { ...ijpRowToData(row), version: row.version },
  });
}

// Full-document save from the editor. Every hand edit bumps the version so
// job scores can detect staleness.
export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = IjpDataSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") },
      { status: 400 },
    );
  }
  const user = await getLocalUser();
  const existing = await prisma.idealJobProfile.findUnique({
    where: { userId: user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "No IJP exists yet" }, { status: 404 });
  }
  const updated = await prisma.idealJobProfile.update({
    where: { userId: user.id },
    data: { ...ijpDataToRow(parsed.data), version: { increment: 1 } },
  });
  return NextResponse.json({
    ijp: { ...ijpRowToData(updated), version: updated.version },
  });
}
