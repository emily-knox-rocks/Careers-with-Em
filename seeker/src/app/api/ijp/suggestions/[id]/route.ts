import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getLocalUser } from "@/lib/user";
import { applySuggestionToIjp, ijpDataToRow, ijpRowToData } from "@/lib/ai/ijp";
import { parseJson } from "@/lib/jsonField";
import type { IjpSuggestionItem } from "@/lib/ai/schemas";

const BodySchema = z.object({ action: z.enum(["accept", "reject"]) });

// Confirm or reject one agent suggestion — the user is always in the loop;
// nothing changes the IJP without an explicit accept.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "action must be accept or reject" }, { status: 400 });
  }

  const user = await getLocalUser();
  const suggestion = await prisma.ijpSuggestion.findUnique({ where: { id } });
  if (!suggestion || suggestion.userId !== user.id) {
    return NextResponse.json({ error: "Suggestion not found" }, { status: 404 });
  }
  if (suggestion.status !== "pending") {
    return NextResponse.json(
      { error: `Suggestion already ${suggestion.status}` },
      { status: 409 },
    );
  }

  if (parsed.data.action === "reject") {
    const updated = await prisma.ijpSuggestion.update({
      where: { id },
      data: { status: "rejected", resolvedAt: new Date() },
    });
    return NextResponse.json({ suggestion: updated });
  }

  const ijpRow = await prisma.idealJobProfile.findUnique({
    where: { userId: user.id },
  });
  if (!ijpRow) {
    return NextResponse.json({ error: "No IJP exists yet" }, { status: 404 });
  }

  const change = parseJson<Pick<
    IjpSuggestionItem,
    "field" | "action" | "value" | "skillPriority"
  > | null>(suggestion.suggestedValue, null);
  if (!change) {
    return NextResponse.json(
      { error: "Suggestion payload is malformed" },
      { status: 500 },
    );
  }

  const nextData = applySuggestionToIjp(ijpRowToData(ijpRow), change);
  const [updatedIjp, updatedSuggestion] = await prisma.$transaction([
    prisma.idealJobProfile.update({
      where: { userId: user.id },
      data: { ...ijpDataToRow(nextData), version: { increment: 1 } },
    }),
    prisma.ijpSuggestion.update({
      where: { id },
      data: { status: "accepted", resolvedAt: new Date() },
    }),
  ]);

  return NextResponse.json({
    suggestion: updatedSuggestion,
    ijp: { ...ijpRowToData(updatedIjp), version: updatedIjp.version },
  });
}
