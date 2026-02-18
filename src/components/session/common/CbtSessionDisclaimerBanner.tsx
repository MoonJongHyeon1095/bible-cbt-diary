import { Info } from "lucide-react";
import styles from "./CbtSessionDisclaimerBanner.module.css";

type CbtSessionDisclaimerBannerProps = {
  message?: string;
};

const DEFAULT_MESSAGE = "앱 중도 이탈시 응답 내용은 보존되지 않습니다.";

export function CbtSessionDisclaimerBanner({
  message = DEFAULT_MESSAGE,
}: CbtSessionDisclaimerBannerProps) {
  return (
    <div className={styles.banner} role="note" aria-live="polite">
      <Info className={styles.icon} aria-hidden />
      <span className={styles.text}>{message}</span>
    </div>
  );
}
