import { parseJsonObject } from "../core/json";
import type { DeepMontagePicture } from "../../deepMontagePicture";

export function parseDeepMontagePictureResponse(
  raw: string,
): DeepMontagePicture | null {
  const parsed = parseJsonObject<DeepMontagePicture>(raw);
  if (parsed) return parsed;
  return { text: "" };
}
