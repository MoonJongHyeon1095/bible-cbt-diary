const WEEKDAY_EN = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;

const pad2 = (value: number) => String(value).padStart(2, "0");

const parseDateParts = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = WEEKDAY_EN[date.getDay()];
  return { year, month, day, weekday };
};

export const formatFlowDateLabel = (value: string) => {
  const parts = parseDateParts(value);
  if (!parts) return "";
  return `${parts.year}.${pad2(parts.month)}.${pad2(parts.day)}`;
};

export const formatFlowAxisDateLabel = (value: string) => {
  const parts = parseDateParts(value);
  if (!parts) return "";
  return `${parts.year}.${pad2(parts.month)}.${pad2(parts.day)}\n${parts.weekday}`;
};
