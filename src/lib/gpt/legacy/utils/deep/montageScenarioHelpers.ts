import type {
  DeepMontageAtom,
  DeepMontageAtomType,
  DeepMontageFreezeFrame,
  DeepMontageFreezeFrameRelation,
  DeepMontageScenario,
  DeepMontageSequenceItem,
} from "../../deepMontageScenario";

const VALID_ATOM_TYPES: DeepMontageAtomType[] = [
  "scene",
  "interpretation",
  "meaning",
  "rule",
  "body",
  "urge",
  "image",
  "dialogue",
];

const VALID_DIRECTIONS: DeepMontageFreezeFrameRelation["direction"][] = [
  "(emotional) body/meaning/interpretation → (automatic cognitive patterns) interpretation/meaning/rule",
  "(automatic cognitive patterns) interpretation/meaning/rule → (error) meaning/rule",
  "(alternative) dialogue/interpretation → (automatic cognitive patterns) interpretation/rule",
];

const VALID_RELATION_TYPES: DeepMontageFreezeFrameRelation["type"][] = [
  "amplifies",
  "triggers",
  "masks",
  "justifies",
  "expressed_as",
  "solidifies_into",
  "hides_within",
  "fails_to_touch",
  "weakens",
  "bypasses",
];

const VALID_CUTS: DeepMontageSequenceItem["cutLogic"][] = [
  "echo",
  "hard_cut",
  "match_cut",
  "jump",
  "escalation",
  "collapse",
  "stall",
];

const VALID_SOURCE_HINTS = new Set(["main", "sub1", "sub2", "alts"]);

function normalizeAtomType(value: string): DeepMontageAtomType {
  if (VALID_ATOM_TYPES.includes(value as DeepMontageAtomType)) {
    return value as DeepMontageAtomType;
  }
  const map: Record<string, DeepMontageAtomType> = {
    emotion: "body",
    thought: "interpretation",
    error: "meaning",
    alternative: "interpretation",
  };
  return map[value] ?? "interpretation";
}

function normalizeLine(value: unknown): string {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);
}

export function normalizeScenario(parsed: DeepMontageScenario): DeepMontageScenario {
  const atoms = Array.isArray(parsed.atoms) ? parsed.atoms : [];
  const normalizedAtoms: DeepMontageAtom[] = atoms
    .map((atom, index) => ({
      id: normalizeLine(atom?.id || `a${index + 1}`),
      atomType: normalizeAtomType(String(atom?.atomType ?? "interpretation")),
      text: normalizeLine(atom?.text),
      sourceHints: Array.isArray(atom?.sourceHints)
        ? atom.sourceHints
            .map(normalizeLine)
            .filter((hint) => VALID_SOURCE_HINTS.has(hint))
        : [],
    }))
    .filter((atom) => atom.id && atom.text);

  const atomIds = new Set(normalizedAtoms.map((atom) => atom.id));

  const sequenceRaw = parsed.montage?.sequence ?? [];
  const sequence: DeepMontageSequenceItem[] = Array.isArray(sequenceRaw)
    ? sequenceRaw
        .map((item) => ({
          atomId: normalizeLine(item?.atomId),
          cutLogic: VALID_CUTS.includes(item?.cutLogic) ? item.cutLogic : "jump",
        }))
        .filter((item) => item.atomId && atomIds.has(item.atomId))
    : [];

  const freezeFramesRaw = Array.isArray(parsed.freezeFrames)
    ? parsed.freezeFrames
    : [];

  const freezeFrames: DeepMontageFreezeFrame[] = freezeFramesRaw.map((frame) => {
    const atomIdsRaw = Array.isArray(frame?.atomIds) ? frame.atomIds : [];
    const atomIdsFiltered = atomIdsRaw
      .map(normalizeLine)
      .filter((id) => atomIds.has(id));

    const relationsRaw = Array.isArray(frame?.relations) ? frame.relations : [];
    const relations: DeepMontageFreezeFrameRelation[] = relationsRaw
      .map((relation) => ({
        direction: VALID_DIRECTIONS.includes(relation?.direction)
          ? relation.direction
          : "(emotional) body/meaning/interpretation → (automatic cognitive patterns) interpretation/meaning/rule",
        type: VALID_RELATION_TYPES.includes(relation?.type)
          ? relation.type
          : "amplifies",
        fromAtomId: normalizeLine(relation?.fromAtomId),
        toAtomId: normalizeLine(relation?.toAtomId),
        note: normalizeLine(relation?.note),
      }))
      .filter(
        (relation) =>
          relation.fromAtomId &&
          relation.toAtomId &&
          atomIds.has(relation.fromAtomId) &&
          atomIds.has(relation.toAtomId),
      );

    return {
      atomIds: atomIdsFiltered,
      dialecticalTension: normalizeLine(frame?.dialecticalTension),
      relations,
      visibility: normalizeLine(frame?.visibility),
    };
  });

  return {
    atoms: normalizedAtoms,
    montage: {
      caption: normalizeLine(parsed.montage?.caption),
      sequence,
    },
    freezeFrames,
  };
}
