import type { EmotionMontage } from "@/lib/types/emotionNoteTypes";

const compareMontage = (left: EmotionMontage, right: EmotionMontage) => {
  const leftStamp = left.created_at ?? "";
  const rightStamp = right.created_at ?? "";
  if (leftStamp && rightStamp && leftStamp !== rightStamp) {
    return rightStamp.localeCompare(leftStamp);
  }
  if (leftStamp && !rightStamp) return -1;
  if (!leftStamp && rightStamp) return 1;
  return right.id - left.id;
};

export const mapMontagesByTargetNoteId = (montages: EmotionMontage[]) => {
  const mapped = new Map<string, EmotionMontage[]>();

  montages.forEach((montage) => {
    const rawIds = [montage.main_note_id, ...(montage.sub_note_ids ?? [])];
    const noteIds = rawIds.filter((id) => Number.isFinite(id));
    if (noteIds.length === 0) return;
    const targetId = Math.max(...noteIds);
    const key = String(targetId);
    const existing = mapped.get(key);
    if (!existing) {
      mapped.set(key, [montage]);
      return;
    }
    existing.push(montage);
  });

  mapped.forEach((list, key) => {
    mapped.set(key, [...list].sort(compareMontage));
  });

  return mapped;
};
