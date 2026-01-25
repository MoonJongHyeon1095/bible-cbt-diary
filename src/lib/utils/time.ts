const KST_TIME_ZONE = "Asia/Seoul";
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

const getKstParts = (value: Date | string) => {
  const date = typeof value === "string" ? new Date(value) : value;
  const kstDate = new Date(date.getTime() + KST_OFFSET_MS);
  return {
    year: kstDate.getUTCFullYear(),
    month: kstDate.getUTCMonth(),
    day: kstDate.getUTCDate(),
  };
};

export const formatKoreanDateTime = (
  value: Date | string,
  options?: Intl.DateTimeFormatOptions,
) => {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: KST_TIME_ZONE,
    ...options,
  }).format(date);
};

export const formatKoreanDateKey = (value: Date | string) => {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: KST_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
};

export const getKstDayRange = (value: Date | string = new Date()) => {
  const { year, month, day } = getKstParts(value);
  const startUtc = Date.UTC(year, month, day, 0, 0, 0) - KST_OFFSET_MS;
  const endUtc = Date.UTC(year, month, day + 1, 0, 0, 0) - KST_OFFSET_MS;
  return {
    startIso: new Date(startUtc).toISOString(),
    endIso: new Date(endUtc).toISOString(),
  };
};

export const getKstMonthRange = (value: Date | string = new Date()) => {
  const { year, month } = getKstParts(value);
  const startUtc = Date.UTC(year, month, 1, 0, 0, 0) - KST_OFFSET_MS;
  const endUtc = Date.UTC(year, month + 1, 1, 0, 0, 0) - KST_OFFSET_MS;
  return {
    startIso: new Date(startUtc).toISOString(),
    endIso: new Date(endUtc).toISOString(),
  };
};
