"use client";

import DetailSectionBadge from "./DetailSectionBadge";
import DetailItemActions, { type DetailItemActionConfig } from "./DetailItemActions";
import styles from "@/components/emotion-notes/detail/EmotionNoteDetailPage.module.css";

type DetailSectionItemProps = {
  badgeText?: string | null;
  body: string;
  secondary?: string | null;
  actions: DetailItemActionConfig;
};

export default function DetailSectionItem({
  badgeText,
  body,
  secondary,
  actions,
}: DetailSectionItemProps) {
  return (
    <>
      {badgeText ? (
        <div className={styles.detailHeader}>
          <DetailSectionBadge text={badgeText} />
        </div>
      ) : null}
      <p className={styles.detailText}>{body}</p>
      {secondary ? <p className={styles.detailEmotion}>{secondary}</p> : null}
      <DetailItemActions actions={actions} />
    </>
  );
}
