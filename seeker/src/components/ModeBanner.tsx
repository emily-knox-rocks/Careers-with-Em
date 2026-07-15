import { llmMode } from "@/lib/llm";

export function ModeBanner() {
  if (llmMode() === "llm") return null;
  return (
    <div className="border-b border-amber-300 bg-amber-50 px-4 py-1.5 text-xs text-amber-900">
      Running without <code className="font-mono">ANTHROPIC_API_KEY</code> —
      LLM features use a deterministic heuristic fallback. Add your key to{" "}
      <code className="font-mono">seeker/.env</code> for full quality.
    </div>
  );
}
