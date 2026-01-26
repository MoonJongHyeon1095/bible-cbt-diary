import { Info } from "lucide-react";
import { useState } from "react";
import styles from "./DisclaimerBanner.module.css";

type DisclaimerBannerProps = {
  detailsClassName: string;
  titleClassName: string;
  textClassName: string;
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
}: DisclaimerBannerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className={styles.banner}>
        <div className={styles.content}>
          <p className={styles.text}>
            <Info className={styles.icon} size={16} aria-hidden="true" />
            <span className={styles.message}>{DISCLAIMER_TEXT}</span>
            <button
              type="button"
              onClick={() => setIsOpen((prev) => !prev)}
              className={styles.button}
              aria-expanded={isOpen}
            >
              자세히
            </button>
          </p>
        </div>
      </div>

      {isOpen ? (
        <div className={detailsClassName} role="note">
          <p className={titleClassName}>{DISCLAIMER_TEXT}</p>
          {SUPPORT_TEXT_LINES.map((line, i) => (
            <p key={i} className={textClassName}>
              {line}
            </p>
          ))}
        </div>
      ) : null}
    </>
  );
}
