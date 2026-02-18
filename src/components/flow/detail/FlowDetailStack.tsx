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

type SectionKey = "alternative" | "innerBelief" | "analysis" | "behavior";

type FlowDetailStackProps = {
  selectedNote: EmotionNote | null;
};

export default function FlowDetailStack({
  selectedNote,
}: FlowDetailStackProps) {
  const [modalContent, setModalContent] = useState<ModalContent>(null);
  const [openSection, setOpenSection] = useState<SectionKey | null>(null);

  const behaviorDetails = selectedNote?.behavior_details ?? [];

  useEffect(() => {
    setModalContent(null);
    setOpenSection(null);
  }, [selectedNote?.id]);

  const sectionItems = [
    {
      key: "alternative" as const,
      label: "대안 사고",
      color: "#36d94a",
      icon: <Lightbulb size={18} />,
      items: selectedNote?.alternative
        ? [
            {
              id: `alternative-${selectedNote.id}`,
              title: selectedNote.alternative,
              body: selectedNote.alternative,
              modalTitle: "대안 사고",
              modalColor: "#36d94a",
              modalIcon: <Lightbulb size={18} />,
              badgeText: null,
            },
          ]
        : [],
    },
    {
      key: "innerBelief" as const,
      label: "Inner Belief",
      color: "#ffd300",
      icon: <Brain size={18} />,
      items: selectedNote?.inner_belief
        ? [
            {
              id: `thought-${selectedNote.id}`,
              title: selectedNote.inner_belief,
              body: selectedNote.inner_belief,
              modalTitle: "Inner Belief",
              modalColor: "#ffd300",
              modalIcon: <Brain size={18} />,
              badgeText: (selectedNote.emotion_tags ?? []).join(", ") || null,
            },
          ]
        : [],
    },
    {
      key: "analysis" as const,
      label: "Analysis",
      color: "#ff4fd8",
      icon: <AlertCircle size={18} />,
      items: selectedNote?.error_description || selectedNote?.error_label
        ? [
            {
              id: `error-${selectedNote.id}`,
              title: selectedNote.error_description || selectedNote.error_label || "",
              body: selectedNote.error_description || selectedNote.error_label || "",
              modalTitle: "Analysis",
              modalColor: "#ff4fd8",
              modalIcon: <AlertCircle size={18} />,
              badgeText: selectedNote.error_label || null,
            },
          ]
        : [],
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
        modalTitle: "행동 반응",
        modalColor: "#26e0ff",
        modalIcon: <Footprints size={18} />,
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
                        title: item.modalTitle,
                        body: item.body,
                        color: item.modalColor,
                        icon: item.modalIcon,
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
