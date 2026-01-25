"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { AlertCircle, Brain, Footprints, Lightbulb } from "lucide-react";
import type { EmotionNote } from "@/lib/types";
import { formatKoreanDateTime } from "@/lib/time";
import DetailSectionItemModal from "@/components/emotion-notes/detail/common/DetailSectionItemModal";
import styles from "./EmotionGraphSection.module.css";

type ModalContent = {
  title: string;
  body: string;
  color: string;
  icon: ReactNode;
  badgeText?: string | null;
} | null;

type SectionKey = "thought" | "error" | "alternative" | "behavior";

type EmotionGraphDetailStackProps = {
  selectedNote: EmotionNote | null;
};

export default function EmotionGraphDetailStack({
  selectedNote,
}: EmotionGraphDetailStackProps) {
  const [modalContent, setModalContent] = useState<ModalContent>(null);
  const [openSection, setOpenSection] = useState<SectionKey | null>(null);

  const thoughtDetails = selectedNote?.thought_details ?? [];
  const errorDetails = selectedNote?.error_details ?? [];
  const alternativeDetails = selectedNote?.alternative_details ?? [];
  const behaviorDetails = selectedNote?.behavior_details ?? [];

  useEffect(() => {
    setModalContent(null);
    setOpenSection(null);
  }, [selectedNote?.id]);

  const formatDateTime = (value: string) =>
    formatKoreanDateTime(value, {
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const sectionItems = [
    {
      key: "thought" as const,
      label: "자동 사고",
      color: "#ffd300",
      icon: <Brain size={18} />,
      items: thoughtDetails.map((detail) => ({
        id: `thought-${detail.id}`,
        title: detail.automatic_thought,
        body: detail.automatic_thought,
        badgeText: detail.emotion || null,
        timeText: formatDateTime(detail.created_at),
      })),
    },
    {
      key: "error" as const,
      label: "인지 오류",
      color: "#ff4fd8",
      icon: <AlertCircle size={18} />,
      items: errorDetails.map((detail) => ({
        id: `error-${detail.id}`,
        title: detail.error_description,
        body: detail.error_description,
        badgeText: detail.error_label,
        timeText: formatDateTime(detail.created_at),
      })),
    },
    {
      key: "alternative" as const,
      label: "대안 사고",
      color: "#36d94a",
      icon: <Lightbulb size={18} />,
      items: alternativeDetails.map((detail) => ({
        id: `alternative-${detail.id}`,
        title: detail.alternative,
        body: detail.alternative,
        badgeText: null,
        timeText: formatDateTime(detail.created_at),
      })),
    },
    {
      key: "behavior" as const,
      label: "행동 반응",
      color: "#26e0ff",
      icon: <Footprints size={18} />,
      items: behaviorDetails.map((detail) => ({
        id: `behavior-${detail.id}`,
        title: detail.behavior_description,
        body: detail.behavior_description,
        badgeText: detail.behavior_label,
        timeText: formatDateTime(detail.created_at),
      })),
    },
  ].filter((section) => section.items.length > 0);

  if (!selectedNote) {
    return null;
  }

  return (
    <>
      <div className={styles.detailStack}>
        {sectionItems.map((section) => (
          <div key={section.key} className={styles.detailStackSection}>
            <button
              type="button"
              className={styles.detailStackHeader}
              onClick={() =>
                setOpenSection((prev) =>
                  prev === section.key ? null : section.key,
                )
              }
            >
              <span
                className={styles.detailStackDot}
                style={{ backgroundColor: section.color }}
              />
              <span className={styles.detailStackLabel}>{section.label}</span>
              <span className={styles.detailStackCount}>
                {section.items.length}
              </span>
            </button>
            {openSection === section.key ? (
              <div className={styles.detailStackList}>
                {section.items.map((item) => (
                  <div
                    key={item.id}
                    className={styles.detailStackItem}
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                      setModalContent({
                        title: section.label,
                        body: item.body,
                        color: section.color,
                        icon: section.icon,
                        badgeText: item.badgeText,
                      })
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setModalContent({
                          title: section.label,
                          body: item.body,
                          color: section.color,
                          icon: section.icon,
                          badgeText: item.badgeText,
                        });
                      }
                    }}
                  >
                    <span className={styles.detailStackItemTitle}>
                      {item.title}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
      <DetailSectionItemModal
        isOpen={Boolean(modalContent)}
        title={modalContent?.title ?? ""}
        body={modalContent?.body ?? ""}
        accentColor={modalContent?.color ?? "#ffffff"}
        icon={modalContent?.icon ?? null}
        badgeText={modalContent?.badgeText ?? null}
        onClose={() => setModalContent(null)}
      />
    </>
  );
}
