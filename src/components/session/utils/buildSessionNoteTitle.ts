import { formatAutoTitle } from "./formatAutoTitle";

const normalizeText = (value: string) => value.replace(/\s+/g, " ").trim();

const toSnippet = (value: string, max = 20) => {
  if (value.length <= max) return value;
  return `${value.slice(0, max).trimEnd()}...`;
};

export function buildSessionNoteTitle(params: {
  emotion?: string;
  incident?: string;
  date?: Date;
}) {
  const emotion = normalizeText(params.emotion ?? "");
  const incident = normalizeText(params.incident ?? "");
  const date = params.date ?? new Date();

  if (emotion && incident) {
    return `${emotion}의 기록 - ${toSnippet(incident)}`;
  }
  if (emotion) {
    return `${emotion}의 기록`;
  }
  if (incident) {
    return toSnippet(incident);
  }
  return formatAutoTitle(date, emotion);
}
