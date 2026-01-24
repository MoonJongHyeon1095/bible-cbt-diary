"use client";

import { useState } from "react";
import styles from "./EmotionNotesSection.module.css";

type EmotionNoteFormProps = {
  onSubmit: (formData: FormData) => Promise<void>;
};

export default function EmotionNoteForm({ onSubmit }: EmotionNoteFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form) {
      return;
    }
    setIsSubmitting(true);
    const formData = new FormData(form);
    await onSubmit(formData);
    setIsSubmitting(false);
    form.reset();
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>제목</span>
        <input
          name="title"
          required
          maxLength={120}
          placeholder="짧게 제목을 적어주세요"
          className={styles.input}
        />
      </label>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>트리거 문장</span>
        <textarea
          name="trigger_text"
          required
          rows={3}
          placeholder="오늘 어떤 일이 있었나요?"
          className={styles.textarea}
        />
      </label>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>행동</span>
        <textarea
          name="behavior"
          rows={2}
          placeholder="내가 보인 반응을 적어주세요"
          className={styles.textarea}
        />
      </label>
      <label className={styles.fieldInline}>
        <span className={styles.fieldLabel}>빈도</span>
        <input
          name="frequency"
          type="number"
          min={1}
          max={10}
          defaultValue={1}
          className={styles.inputSmall}
        />
        <span className={styles.fieldHint}>1은 거의 한 번, 10은 매우 자주</span>
      </label>
      <button
        type="submit"
        className={styles.submitButton}
        disabled={isSubmitting}
      >
        {isSubmitting ? "저장 중..." : "기록 저장"}
      </button>
    </form>
  );
}
