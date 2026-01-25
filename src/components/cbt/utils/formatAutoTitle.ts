export function formatAutoTitle(date: Date, emotion?: string) {
  const normalizedEmotion = emotion?.trim();
  if (normalizedEmotion) {
    return `${normalizedEmotion}의 기록`;
  }
  const pad = (value: number) => value.toString().padStart(2, "0");
  const yy = date.getFullYear().toString().slice(2);
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const min = pad(date.getMinutes());
  return `${yy}년 ${mm}월 ${dd}일 ${hh}시 ${min}분에 저장`;
}
