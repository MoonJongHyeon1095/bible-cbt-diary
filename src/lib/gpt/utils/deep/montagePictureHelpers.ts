const DIRECTION_AFFECT = "affect_to_pattern";
const DIRECTION_ERROR = "pattern_to_error";
const DIRECTION_ALTERNATIVE = "alt_to_pattern";

export function mapRelationDirectionForPicture(raw: string | undefined): string {
  if (!raw) return DIRECTION_AFFECT;
  if (
    raw === DIRECTION_AFFECT ||
    raw === DIRECTION_ERROR ||
    raw === DIRECTION_ALTERNATIVE
  ) {
    return raw;
  }
  const normalized = raw.toLowerCase();
  if (normalized.includes("error")) return DIRECTION_ERROR;
  if (normalized.includes("alternative") || normalized.includes("dialogue")) {
    return DIRECTION_ALTERNATIVE;
  }
  if (normalized.includes("emotional") || normalized.includes("body")) {
    return DIRECTION_AFFECT;
  }
  return DIRECTION_AFFECT;
}
