import { parseJsonObject } from "../core/json";
import type { DeepMontagePicture } from "../../deepMontagePicture";

export function createEmptyDeepMontagePicture(): DeepMontagePicture {
  return {
    atomsText: [],
    montageText: {
      caption: "",
      sequenceText: [],
      cutLogicText: [],
    },
    freezeFramesText: [],
  };
}

export function parseDeepMontagePictureResponse(
  raw: string,
): DeepMontagePicture | null {
  const parsed = parseJsonObject<DeepMontagePicture>(raw);
  if (parsed) return parsed;
  return createEmptyDeepMontagePicture();
}
