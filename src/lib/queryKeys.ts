import type { AccessContext } from "@/lib/types/access";

const accessKey = (access: AccessContext) => ({
  mode: access.mode,
  token: access.accessToken ?? null,
});

export const queryKeys = {
  emotionNotes: {
    all: ["emotion-notes"] as const,
    list: (access: AccessContext) =>
      ["emotion-notes", "list", accessKey(access)] as const,
    range: (access: AccessContext, start: string, end: string) =>
      ["emotion-notes", "range", accessKey(access), start, end] as const,
    search: (
      access: AccessContext,
      query: string,
      start: string,
      end: string,
      excludeFlowId?: number | null,
    ) =>
      [
        "emotion-notes",
        "search",
        accessKey(access),
        query,
        start,
        end,
        excludeFlowId ?? null,
      ] as const,
    detail: (access: AccessContext, noteId: number) =>
      ["emotion-notes", "detail", accessKey(access), noteId] as const,
  },
  thoughtDetails: (access: AccessContext, noteId: number) =>
    ["emotion-note-details", accessKey(access), noteId] as const,
  errorDetails: (access: AccessContext, noteId: number) =>
    ["emotion-error-details", accessKey(access), noteId] as const,
  alternativeDetails: (access: AccessContext, noteId: number) =>
    ["emotion-alternative-details", accessKey(access), noteId] as const,
  behaviorDetails: (access: AccessContext, noteId: number) =>
    ["emotion-behavior-details", accessKey(access), noteId] as const,
  sessionHistory: {
    all: ["session-history"] as const,
    list: (access: AccessContext) =>
      ["session-history", "list", accessKey(access)] as const,
  },
  flow: {
    all: ["emotion-flow"] as const,
    flows: (access: AccessContext, noteId?: number | null) =>
      ["emotion-flow", "flows", accessKey(access), noteId ?? null] as const,
    flow: (access: AccessContext, flowId: number, includeMiddles: boolean) =>
      [
        "emotion-flow",
        "flow",
        accessKey(access),
        flowId,
        includeMiddles,
      ] as const,
  },
  share: {
    all: ["share-snapshot"] as const,
    snapshot: (shareId: string) =>
      ["share-snapshot", shareId] as const,
  },
  notice: {
    list: ["notice", "list"] as const,
  },
  tokenUsage: {
    all: ["token-usage"] as const,
    byDevice: (deviceId: string | null) =>
      ["token-usage", deviceId] as const,
  },
  ai: {
    autoThoughtSuggestions: (key: string) =>
      ["ai", "auto-thought-suggestions", key] as const,
    alternativeThoughts: (key: string) =>
      ["ai", "alternative-thoughts", key] as const,
    cognitiveErrorRank: (key: string) =>
      ["ai", "cognitive-errors", "rank", key] as const,
    cognitiveErrorDetail: (key: string, indicesKey: string) =>
      ["ai", "cognitive-errors", "detail", key, indicesKey] as const,
    deepAutoThought: (key: string) =>
      ["ai", "deep-auto-thought", key] as const,
    deepAlternativeThoughts: (key: string) =>
      ["ai", "deep-alternative-thoughts", key] as const,
    deepInternalContext: (key: string) =>
      ["ai", "deep-internal-context", key] as const,
    deepCognitiveErrorRank: (key: string) =>
      ["ai", "deep-cognitive-errors", "rank", key] as const,
    deepCognitiveErrorDetail: (key: string, indicesKey: string) =>
      ["ai", "deep-cognitive-errors", "detail", key, indicesKey] as const,
  },
} as const;
