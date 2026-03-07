import type { DeepInternalContext } from "../../deepContext";
import {
  normalizeCbt,
  normalizeDeep,
  normalizeSalient,
} from "./contextNormalize";

export function getFallbackDeepInternalContext(): DeepInternalContext {
  return {
    salient: normalizeSalient({}),
    cbt: normalizeCbt({}),
    deep: normalizeDeep({}),
  };
}
