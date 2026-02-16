const WEEKDAY_EN = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;

const pad2 = (value: number) => String(value).padStart(2, "0");

const parseDateParts = (value: string) => {
  const text = value.trim();
  const ymdMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymdMatch) {
    const year = Number(ymdMatch[1]);
    const month = Number(ymdMatch[2]);
    const day = Number(ymdMatch[3]);
    if (
      Number.isFinite(year) &&
      Number.isFinite(month) &&
      Number.isFinite(day) &&
      month >= 1 &&
      month <= 12 &&
      day >= 1 &&
      day <= 31
    ) {
      const weekdayDate = new Date(`${ymdMatch[1]}-${ymdMatch[2]}-${ymdMatch[3]}T00:00:00`);
      const weekday = Number.isNaN(weekdayDate.getTime())
        ? WEEKDAY_EN[0]
        : WEEKDAY_EN[weekdayDate.getDay()];
      return { year, month, day, weekday };
    }
  }

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
