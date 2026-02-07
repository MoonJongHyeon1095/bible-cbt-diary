export type PromptSection = {
  title: string;
  body: string;
  emptyFallback?: string;
};

export function buildPrompt(
  sections: PromptSection[],
  options?: { suffix?: string },
): string {
  const rendered = sections
    .map((section) => {
      const body = section.body?.trim()
        ? section.body
        : section.emptyFallback ?? "";
      return `[${section.title}]\n${body}`.trimEnd();
    })
    .join("\n\n");

  const combined = options?.suffix
    ? `${rendered}\n\n${options.suffix}`
    : rendered;

  return combined.trim();
}
