"use client";

import EmotionNoteDetailSectionItemModal from "@/components/emotion-notes/detail/common/EmotionNoteDetailSectionItemModal";
import type { EmotionNote } from "@/lib/types/emotionNoteTypes";
import { AlertCircle, Brain, Footprints, Lightbulb } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import styles from "./FlowDetailSection.module.css";
import SafeButton from "@/components/ui/SafeButton";

type ModalContent = {
  title: string;
  body: string;
  color: string;
  icon: ReactNode;
  badgeText?: string | null;
} | null;

type SectionKey = "thought" | "error" | "alternative" | "behavior";

type FlowDetailStackProps = {
  selectedNote: EmotionNote | null;
};

export default function FlowDetailStack({
  selectedNote,
}: FlowDetailStackProps) {
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
            <SafeButton mode="native"
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
            </SafeButton>
            {openSection === section.key ? (
              <div className={styles.detailStackList}>
                {section.items.map((item) => (
                  <SafeButton
                    mode="native"
                    key={item.id}
                    className={styles.detailStackItem}
                    onClick={() =>
                      setModalContent({
                        title: section.label,
                        body: item.body,
                        color: section.color,
                        icon: section.icon,
                        badgeText: item.badgeText,
                      })
                    }
                  >
                    <span className={styles.detailStackItemTitle}>
                      {item.title}
                    </span>
                  </SafeButton>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
      <EmotionNoteDetailSectionItemModal
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
