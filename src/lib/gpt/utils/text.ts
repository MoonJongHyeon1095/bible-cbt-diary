export function cleanText(v: unknown): string {
  return typeof v === "string" ? v.replace(/\s+/g, " ").trim() : "";
}

export function normalizeTextValue(v: unknown): string {
  return typeof v === "string" ? cleanText(v) : "";
}
