"use client";

import pageStyles from "@/app/page.module.css";
import { buildApiUrl } from "@/lib/utils/apiBase";
import { AlertCircle, Brain, Footprints, Lightbulb } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import styles from "./SharePage.module.css";

type ShareSection = "thought" | "error" | "alternative" | "behavior";

const SECTION_LABELS: Record<ShareSection, string> = {
  thought: "자동 사고",
  error: "인지 오류",
  alternative: "대안 사고",
  behavior: "행동 반응",
};

const SECTION_ICONS: Record<ShareSection, React.ReactNode> = {
  thought: <Brain size={18} />,
  error: <AlertCircle size={18} />,
  alternative: <Lightbulb size={18} />,
  behavior: <Footprints size={18} />,
};

export default function SharePublicPage() {
  const searchParams = useSearchParams();
  const shareId = searchParams.get("sid");

  const [share, setShare] = useState<{
    title: string;
    trigger_text: string;
    sections: Record<string, unknown>;
  } | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadShare = async () => {
      if (!shareId) {
        setError("공유 링크가 올바르지 않습니다.");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(
          buildApiUrl(`/api/share-snap-shots?sid=${shareId}`),
        );
        const data = response.ok
          ? ((await response.json()) as {
              share: {
                title: string;
                trigger_text: string;
                sections: Record<string, unknown>;
              } | null;
              message?: string;
            })
          : { share: null, message: "공유 내용을 불러오지 못했습니다." };

        if (!response.ok || !data.share) {
          setError(data.message ?? "공유 내용을 찾을 수 없습니다.");
          setIsLoading(false);
          return;
        }

        setShare(data.share);
        setIsLoading(false);
      } catch {
        setError("공유 내용을 불러오지 못했습니다.");
        setIsLoading(false);
      }
    };

    setIsLoading(true);
    loadShare();
  }, [shareId]);

  const sections = useMemo(() => {
    if (!share) return [] as { key: ShareSection; items: unknown[] }[];
    return (Object.keys(SECTION_LABELS) as ShareSection[]).map((key) => ({
      key,
      items: Array.isArray(share.sections?.[key])
        ? (share.sections[key] as unknown[])
        : [],
    }));
  }, [share]);

  return (
    <div className={`${pageStyles.page} ${styles.publicPage}`}>
      <main className={pageStyles.main}>
        <div className={`${pageStyles.shell} ${styles.publicShell}`}>
          {isLoading ? <p className={styles.hint}>불러오는 중...</p> : null}
          {error ? <p className={styles.hint}>{error}</p> : null}

          {share ? (
            <>
              <section className={styles.publicNoteCard}>
                <span className={styles.publicPill}>Shared Note</span>
                <h2 className={styles.publicNoteTitle}>
                  {share.title || "제목 없음"}
                </h2>
                <div className={styles.publicNoteBody}>
                  <p className={styles.publicNoteText}>
                    {share.trigger_text || "트리거 없음"}
                  </p>
                </div>
              </section>

              <section className={styles.publicGrid}>
                {sections.map(({ key, items }) => (
                  <div
                    key={key}
                    className={`${styles.publicSectionCard} ${styles[`publicSectionCard_${key}`]}`}
                  >
                    <div className={styles.publicSectionHeader}>
                      <div>
                        <h3 className={styles.publicSectionTitle}>
                          <span className={styles.publicSectionIcon}>
                            {SECTION_ICONS[key]}
                          </span>
                          {SECTION_LABELS[key]}
                        </h3>
                        <span className={styles.sectionMeta}>
                          {items.length}개 항목
                        </span>
                      </div>
                    </div>
                    {items.length === 0 ? (
                      <p className={styles.emptyState}>
                        공개된 항목이 없습니다.
                      </p>
                    ) : (
                      <div
                        className={`${styles.itemList} ${styles.publicItemList}`}
                      >
                        {items.map((item, index) => {
                          const data = item as Record<string, unknown>;
                          return (
                            <div
                              key={`${key}-${index}`}
                              className={styles.publicItem}
                            >
                              <div className={styles.itemBody}>
                                {key === "thought" ? (
                                  <>
                                    <span
                                      className={`${styles.badgePill} ${styles.badgeThought}`}
                                    >
                                      감정: {(data.emotion as string) || "-"}
                                    </span>
                                    <p className={styles.itemText}>
                                      {(data.automatic_thought as string) ||
                                        "-"}
                                    </p>
                                  </>
                                ) : null}
                                {key === "error" ? (
                                  <>
                                    <span
                                      className={`${styles.badgePill} ${styles.badgeError}`}
                                    >
                                      {(data.error_label as string) || "-"}
                                    </span>
                                    <p className={styles.itemText}>
                                      {(data.error_description as string) ||
                                        "-"}
                                    </p>
                                  </>
                                ) : null}
                                {key === "alternative" ? (
                                  <p className={styles.itemText}>
                                    {(data.alternative as string) || "-"}
                                  </p>
                                ) : null}
                                {key === "behavior" ? (
                                  <>
                                    <span
                                      className={`${styles.badgePill} ${styles.badgeBehavior}`}
                                    >
                                      {(data.behavior_label as string) || "-"}
                                    </span>
                                    <p className={styles.itemText}>
                                      {(data.behavior_description as string) ||
                                        "-"}
                                    </p>
                                    {Array.isArray(data.error_tags) &&
                                    data.error_tags.length > 0 ? (
                                      <div className={styles.tagList}>
                                        {data.error_tags.map((tag) => (
                                          <span
                                            key={`${key}-${tag}`}
                                            className={styles.tagChip}
                                          >
                                            {tag}
                                          </span>
                                        ))}
                                      </div>
                                    ) : null}
                                  </>
                                ) : null}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </section>
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
}
