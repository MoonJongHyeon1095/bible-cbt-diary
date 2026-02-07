import { cleanText } from "../core/text";
import type { DeepInternalContext } from "../../deepContext";

type LlmSalient = {
  actors?: unknown;
  events?: unknown;
  needs?: unknown;
  threats?: unknown;
  emotions?: unknown;
};

type LlmDeep = {
  repeatingPatterns?: unknown;
  tensions?: unknown;
  invariants?: unknown;
  conditionalRules?: unknown;
  leveragePoints?: unknown;
  bridgeHypothesis?: unknown;
};

type LlmCbt = {
  topDistortions?: unknown;
  coreBeliefsHypothesis?: unknown;
};

function normalizeStringArray(v: unknown, max: number): string[] {
  if (!Array.isArray(v)) return [];
  const arr = v.map(cleanText).filter(Boolean);
  return arr.slice(0, max);
}

export function normalizeDeep(v: unknown): DeepInternalContext["deep"] {
  const obj = v && typeof v === "object" ? (v as LlmDeep) : ({} as LlmDeep);

  const repeatingPatterns = normalizeStringArray(obj.repeatingPatterns, 4);
  const tensions = normalizeStringArray(obj.tensions, 3);
  const invariants = normalizeStringArray(obj.invariants, 3);
  const conditionalRules = normalizeStringArray(obj.conditionalRules, 2);
  const leveragePoints = normalizeStringArray(obj.leveragePoints, 2);
  const bridgeHypothesis = normalizeStringArray(obj.bridgeHypothesis, 2);

  const fb = {
    repeatingPatterns: ["repeat negative interpretation"],
    tensions: ["past vs present fear mismatch"],
    invariants: ["need for validation"],
    conditionalRules: ["If I fail, then I will be rejected"],
    leveragePoints: ["separate facts from interpretation"],
    bridgeHypothesis: ["current trigger reactivates an older fear pattern"],
  } as const;

  return {
    repeatingPatterns: repeatingPatterns.length
      ? repeatingPatterns
      : [...fb.repeatingPatterns],
    tensions: tensions.length ? tensions : [...fb.tensions],
    invariants: invariants.length ? invariants : [...fb.invariants],
    conditionalRules: conditionalRules.length
      ? conditionalRules
      : [...fb.conditionalRules],
    leveragePoints: leveragePoints.length
      ? leveragePoints
      : [...fb.leveragePoints],
    bridgeHypothesis: bridgeHypothesis.length
      ? bridgeHypothesis
      : [...fb.bridgeHypothesis],
  };
}

export function normalizeSalient(v: unknown): DeepInternalContext["salient"] {
  const obj =
    v && typeof v === "object" ? (v as LlmSalient) : ({} as LlmSalient);

  const actors = normalizeStringArray(obj.actors, 4);
  const events = normalizeStringArray(obj.events, 4);
  const needs = normalizeStringArray(obj.needs, 4);
  const threats = normalizeStringArray(obj.threats, 4);
  const emotions = normalizeStringArray(obj.emotions, 4);

  const fb = {
    actors: ["self"],
    events: ["unclear situation"],
    needs: ["clarity"],
    threats: ["rejection"],
    emotions: ["anxiety"],
  } as const;

  return {
    actors: actors.length > 0 ? actors : [...fb.actors],
    events: events.length > 0 ? events : [...fb.events],
    needs: needs.length > 0 ? needs : [...fb.needs],
    threats: threats.length > 0 ? threats : [...fb.threats],
    emotions: emotions.length > 0 ? emotions : [...fb.emotions],
  };
}

export function normalizeCbt(v: unknown): DeepInternalContext["cbt"] {
  const obj = v && typeof v === "object" ? (v as LlmCbt) : ({} as LlmCbt);
  const topDistortions = normalizeStringArray(obj.topDistortions, 2);
  const coreBeliefsHypothesis = normalizeStringArray(
    obj.coreBeliefsHypothesis,
    2,
  );

  const fb = {
    topDistortions: ["Mind reading"],
    coreBeliefsHypothesis: ["I am not enough"],
  } as const;

  return {
    topDistortions:
      topDistortions.length > 0 ? topDistortions : [...fb.topDistortions],
    coreBeliefsHypothesis:
      coreBeliefsHypothesis.length > 0
        ? coreBeliefsHypothesis
        : [...fb.coreBeliefsHypothesis],
  };
}
