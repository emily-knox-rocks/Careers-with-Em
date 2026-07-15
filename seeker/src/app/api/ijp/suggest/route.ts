import { NextResponse } from "next/server";
import { getLocalUser } from "@/lib/user";
import { generateIjpSuggestions } from "@/lib/ai/suggest";

// Fold accumulated yes/maybe/no feedback into pending IJP suggestions.
export async function POST() {
  const user = await getLocalUser();
  try {
    const result = await generateIjpSuggestions(user.id);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Suggestion run failed" },
      { status: 400 },
    );
  }
}
