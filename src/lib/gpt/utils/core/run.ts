import { callGptText } from "../../client";

export type RunGptJsonOptions<T> = {
  prompt: string;
  systemPrompt: string;
  model?: string;
  noteProposal?: boolean;
  parse: (raw: string) => T | null;
  tag?: string;
  requireParsed?: boolean;
};

type RunGptJsonErrorStage = "call" | "parse";

export class GptJsonError extends Error {
  stage: RunGptJsonErrorStage;
  tag?: string;
  rawSnippet?: string;

  constructor(
    message: string,
    stage: RunGptJsonErrorStage,
    options?: { tag?: string; rawSnippet?: string; cause?: unknown },
  ) {
    super(message);
    this.name = "GptJsonError";
    this.stage = stage;
    this.tag = options?.tag;
    this.rawSnippet = options?.rawSnippet;
    if (options?.cause !== undefined) {
      (this as Error & { cause?: unknown }).cause = options.cause;
    }
  }
}

export async function runGptJson<T>(
  options: RunGptJsonOptions<T> & { requireParsed?: true },
): Promise<{ raw: string; parsed: NonNullable<T> }>;
export async function runGptJson<T>(
  options: RunGptJsonOptions<T> & { requireParsed: false },
): Promise<{ raw: string; parsed: T | null }>;
export async function runGptJson<T>(
  options: RunGptJsonOptions<T>,
): Promise<{ raw: string; parsed: T | null }> {
  const tag = options.tag ? `gpt:${options.tag}` : "gpt";
  const promptChars = options.prompt?.length ?? 0;

  console.log(`[${tag}] request`, {
    model: options.model ?? "(default)",
    promptChars,
    noteProposal: Boolean(options.noteProposal),
  });

  let raw: string;
  try {
    raw = await callGptText(options.prompt, {
      systemPrompt: options.systemPrompt,
      model: options.model,
      noteProposal: options.noteProposal,
    });
  } catch (error) {
    console.error(`[${tag}] request failed`, error);
    throw new GptJsonError(`[${tag}] request failed`, "call", {
      tag,
      cause: error,
    });
  }

  const parsed = options.parse(raw);
  if (!parsed) {
    const rawSnippet = raw.slice(0, 500);
    console.warn(`[${tag}] parse failed`, { rawChars: raw.length });
    if (options.requireParsed ?? true) {
      throw new GptJsonError(`[${tag}] parse failed`, "parse", {
        tag,
        rawSnippet,
      });
    }
  }

  return { raw, parsed };
}
