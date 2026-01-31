export function parseInteger(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return Math.trunc(v);
  if (typeof v === "string") {
    const parsed = Number.parseInt(v.trim(), 10);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}
