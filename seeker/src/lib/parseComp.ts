// Parse a human-entered compensation amount ("140000", "$140,000", "140k",
// "$120k") into annual dollars. Returns null when it can't be read.
export function parseCompValue(raw: string): number | null {
  const cleaned = raw.trim().toLowerCase();
  const match = cleaned.match(/(\d+(?:[.,]\d{3})*(?:\.\d+)?)\s*(k)?/);
  if (!match) return null;
  let n = parseFloat(match[1].replace(/,/g, ""));
  if (!Number.isFinite(n) || n <= 0) return null;
  if (match[2]) n *= 1000;
  // "140" with no suffix almost certainly means thousands for a salary floor
  if (n < 5000) n *= 1000;
  return Math.round(n);
}
