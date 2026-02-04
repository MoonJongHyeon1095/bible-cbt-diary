type AiFallbackLevel = "partial" | "hard";
type AiFallbackCheck = AiFallbackLevel | "any";

export function markAiFallback<T>(value: T, level: AiFallbackLevel = "hard"): T {
  if (value && typeof value === "object") {
    Object.defineProperty(value as object, "__fallback", {
      value: level,
      enumerable: false,
    });
  }
  return value;
}

export function isAiFallback(
  value: unknown,
  level: AiFallbackCheck = "hard",
): boolean {
  if (!value || typeof value !== "object") return false;
  const marker = (value as { __fallback?: AiFallbackLevel }).__fallback;
  if (!marker) return false;
  if (level === "any") return true;
  return marker === level;
}
