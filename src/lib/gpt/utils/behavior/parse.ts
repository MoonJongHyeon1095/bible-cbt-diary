import { parseJsonObject } from "../core/json";

export type BehaviorSuggestionItem<TBehaviorId extends string> = {
  behaviorId?: TBehaviorId;
  suggestion?: string;
};

type BehaviorSuggestionsResponseShape<TBehaviorId extends string> = {
  suggestions?: BehaviorSuggestionItem<TBehaviorId>[];
};

export function parseBehaviorSuggestionsResponse<TBehaviorId extends string>(
  raw: string,
): BehaviorSuggestionItem<TBehaviorId>[] | null {
  const parsed = parseJsonObject<BehaviorSuggestionsResponseShape<TBehaviorId>>(
    raw,
  );
  if (!parsed) return null;
  const arr = parsed.suggestions;
  return Array.isArray(arr) ? arr : [];
}
