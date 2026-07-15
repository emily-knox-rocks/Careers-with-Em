import fs from "fs";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";

// Every LLM prompt lives in its own file under /prompts so prompts can be
// iterated on without touching app code. This module is the only place that
// talks to the Anthropic API.

const DEFAULT_MODEL = "claude-opus-4-8";

export type LlmMode = "llm" | "heuristic";

export function llmMode(): LlmMode {
  if (process.env.SEEKER_LLM === "off") return "heuristic";
  return process.env.ANTHROPIC_API_KEY ? "llm" : "heuristic";
}

const promptsDir = path.join(process.cwd(), "prompts");

export function loadPrompt(
  name: string,
  vars: Record<string, string>,
): string {
  const file = path.join(promptsDir, `${name}.md`);
  const raw = fs.readFileSync(file, "utf8");
  return raw.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    const value = vars[key];
    if (value === undefined) {
      throw new Error(`Prompt "${name}" is missing variable {{${key}}}`);
    }
    return value;
  });
}

/**
 * Run a prompt file against the Anthropic API and parse the response into a
 * zod schema via structured outputs. Throws when no API key is configured —
 * callers are expected to catch and use their heuristic fallback.
 */
export async function runPrompt<T>(
  name: string,
  vars: Record<string, string>,
  schema: z.ZodType<T>,
  opts: { maxTokens?: number } = {},
): Promise<T> {
  if (llmMode() !== "llm") {
    throw new LlmUnavailableError();
  }
  const prompt = loadPrompt(name, vars);
  const client = new Anthropic();
  const response = await client.messages.parse({
    model: process.env.SEEKER_MODEL || DEFAULT_MODEL,
    max_tokens: opts.maxTokens ?? 16000,
    thinking: { type: "adaptive" },
    messages: [{ role: "user", content: prompt }],
    output_config: { format: zodOutputFormat(schema) },
  });
  if (response.stop_reason === "refusal") {
    throw new Error(`LLM refused prompt "${name}"`);
  }
  if (response.parsed_output == null) {
    throw new Error(`LLM returned unparseable output for prompt "${name}"`);
  }
  return response.parsed_output as T;
}

export class LlmUnavailableError extends Error {
  constructor() {
    super("ANTHROPIC_API_KEY is not set (or SEEKER_LLM=off)");
    this.name = "LlmUnavailableError";
  }
}

/**
 * Run the LLM path, falling back to a deterministic implementation when the
 * API is unavailable or the call fails. Returns which engine produced the
 * result so it can be stored/shown to the user.
 */
export async function withFallback<T>(
  llmFn: () => Promise<T>,
  fallbackFn: () => T | Promise<T>,
): Promise<{ result: T; engine: "llm" | "heuristic" }> {
  if (llmMode() === "llm") {
    try {
      return { result: await llmFn(), engine: "llm" };
    } catch (err) {
      console.error("LLM call failed, using heuristic fallback:", err);
    }
  }
  return { result: await fallbackFn(), engine: "heuristic" };
}
