import type { DeepInternalContext } from "../../deepContext";

export function buildDeepCognitiveAnalysisInternal(
  internal: DeepInternalContext,
): string {
  return `
deep (PRIMARY):
- repeatingPatterns: ${internal.deep.repeatingPatterns.join(" | ")}
- tensions: ${internal.deep.tensions.join(" | ")}
- invariants: ${internal.deep.invariants.join(" | ")}
- conditionalRules: ${internal.deep.conditionalRules.join(" | ")}
- leveragePoints: ${internal.deep.leveragePoints.join(" | ")}
- bridgeHypothesis: ${internal.deep.bridgeHypothesis.join(" | ")}

secondary:
- salient.actors: ${internal.salient.actors.join(" | ")}
- salient.events: ${internal.salient.events.join(" | ")}
- salient.needs: ${internal.salient.needs.join(" | ")}
- salient.threats: ${internal.salient.threats.join(" | ")}
- salient.emotions: ${internal.salient.emotions.join(" | ")}
- cbt.topDistortions: ${internal.cbt.topDistortions.join(" | ")}
- cbt.coreBeliefsHypothesis: ${internal.cbt.coreBeliefsHypothesis.join(" | ")}
`.trim();
}
