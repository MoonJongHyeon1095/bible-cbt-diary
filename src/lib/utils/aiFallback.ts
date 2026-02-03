export function markAiFallback<T>(value: T): T {
  if (value && typeof value === "object") {
    Object.defineProperty(value as object, "__fallback", {
      value: true,
      enumerable: false,
    });
  }
  return value;
}

export function isAiFallback(value: unknown): boolean {
  return Boolean(
    value && typeof value === "object" && (value as { __fallback?: boolean }).__fallback,
  );
}
