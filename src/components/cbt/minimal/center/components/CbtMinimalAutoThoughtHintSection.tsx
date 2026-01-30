import styles from "../../MinimalStyles.module.css";

export function CbtMinimalAutoThoughtHintSection() {
  return (
    <div className={styles.formStack}>
      <p className={styles.detailTitle}>당신의 생각을 직접 적어보세요</p>
      <p className={styles.helperText}>
        솔직한 문장이 가장 좋은 출발점입니다.
      </p>
    </div>
  );
}
