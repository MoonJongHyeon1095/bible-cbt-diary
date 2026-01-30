"use client";

import EmotionNoteDetailSectionBadge from "./EmotionNoteDetailSectionBadge";
import EmotionNoteDetailItemActions, { type DetailItemActionConfig } from "./EmotionNoteDetailItemActions";
import styles from "@/components/emotion-notes/detail/EmotionNoteDetailPage.module.css";

type EmotionNoteDetailSectionItemProps = {
  badgeText?: string | null;
  body: string;
  secondary?: string | null;
  actions: DetailItemActionConfig;
};

export default function EmotionNoteDetailSectionItem({
  badgeText,
  body,
  secondary,
  actions,
}: EmotionNoteDetailSectionItemProps) {
  return (
    <>
      {badgeText ? (
        <div className={styles.detailHeader}>
          <EmotionNoteDetailSectionBadge text={badgeText} />
        </div>
      ) : null}
      <p className={styles.detailText}>{body}</p>
      {secondary ? <p className={styles.detailEmotion}>{secondary}</p> : null}
      <EmotionNoteDetailItemActions actions={actions} />
    </>
  );
}
