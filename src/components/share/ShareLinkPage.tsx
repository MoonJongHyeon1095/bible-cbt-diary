"use client";

import pageStyles from "@/app/page.module.css";
import { useCbtToast } from "@/components/cbt/common/CbtToast";
import FloatingActionButton from "@/components/common/FloatingActionButton";
import Button from "@/components/ui/Button";
import { buildApiUrl } from "@/lib/utils/apiBase";
import { BookSearch, Copy } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import styles from "./SharePage.module.css";

export default function ShareLinkPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { pushToast } = useCbtToast();
  const shareId = searchParams.get("sid");
  const noteId = searchParams.get("noteId");

  const shareUrl = useMemo(() => {
    if (!shareId) return "";
    return buildApiUrl(`/share?sid=${shareId}`);
  }, [shareId]);

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      pushToast("공유 링크를 복사했어요.", "success");
    } catch {
      pushToast("복사에 실패했어요.", "error");
    }
  };

  if (!shareId) {
    return (
      <div className={pageStyles.page}>
        <main className={pageStyles.main}>
          <div className={pageStyles.shell}>
            <div className={styles.shareCard}>
              <h1 className={styles.title}>공유 링크 생성 실패</h1>
              <p className={styles.subtitle}>다시 시도해주세요.</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={pageStyles.page}>
      <main className={`${pageStyles.main} ${styles.linkMain}`}>
        <div className={`${pageStyles.shell} ${styles.linkShell}`}>
          <section className={styles.shareCard}>
            <div
              className={`${styles.shareLinkBox} ${styles.shareLinkBoxCentered}`}
            >
              <div className={styles.shareLinkHeader}>
                <span className={styles.sectionMeta}>공유 링크</span>
                <span className={styles.shareLinkNote}>
                  생성 후 7일 뒤 만료됩니다.
                </span>
              </div>
              <div className={styles.shareLinkRow}>
                <span className={styles.shareLinkValue}>
                  {shareUrl || buildApiUrl(`/share?sid=${shareId}`)}
                </span>
                <Button type="button" variant="outline" onClick={handleCopy}>
                  <Copy size={16} />
                  복사하기
                </Button>
              </div>
              <p className={styles.shareLinkWarn}>
                민감한 정보가 포함되지 않도록 주의해주세요.
              </p>
            </div>
          </section>
        </div>
      </main>
      {noteId ? (
        <FloatingActionButton
          label="노트로"
          icon={<BookSearch size={22} />}
          helperText="노트로 돌아가기"
          onClick={() => router.push(`/detail?id=${noteId}`)}
          style={{
            bottom: "16vh",
            ["--fab-bottom-mobile" as string]: "20vh",
          }}
        />
      ) : null}
    </div>
  );
}
