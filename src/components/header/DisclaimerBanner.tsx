import styles from "./DisclaimerBanner.module.css";
import SafeButton from "@/components/ui/SafeButton";

type DisclaimerBannerProps = {
  detailsClassName: string;
  titleClassName: string;
  textClassName: string;
  onDismiss?: () => void;
};

export const DISCLAIMER_TEXT = "이 앱은 치료/진단용이 아닙니다.";

export const SUPPORT_TEXT_LINES = [
  "당신의 서술을 바탕으로 AI가 내용을 생성합니다.",
  "생성된 내용은 전문가의 검토를 거치지 않았으며 오류가 있을 수 있습니다.",
];

export default function DisclaimerBanner({
  detailsClassName,
  titleClassName,
  textClassName,
  onDismiss,
}: DisclaimerBannerProps) {
  const handleDismiss = () => {
    onDismiss?.();
  };

  return (
    <div className={detailsClassName} role="note">
      <div className={styles.detailsHeader}>
        <p className={titleClassName}>{DISCLAIMER_TEXT}</p>
        <SafeButton
          mode="native"
          type="button"
          onClick={handleDismiss}
          className={styles.dismissButton}
        >
          <span className={styles.checkbox} aria-hidden="true" />
          <span className={styles.dismissLabel}>이해했습니다</span>
        </SafeButton>
      </div>
      {SUPPORT_TEXT_LINES.map((line) => (
        <p key={line} className={textClassName}>
          {line}
        </p>
      ))}
    </div>
  );
}
