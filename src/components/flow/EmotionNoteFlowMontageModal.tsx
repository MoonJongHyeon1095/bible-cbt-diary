"use client";

import CharacterPrompt from "@/components/ui/CharacterPrompt";
import SafeButton from "@/components/ui/SafeButton";
import type { EmotionMontage } from "@/lib/types/emotionNoteTypes";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import styles from "./EmotionNoteFlowSection.module.css";

const ensureArray = <T,>(value: unknown): T[] =>
  Array.isArray(value) ? (value as T[]) : [];

const normalizeText = (value: unknown) => String(value ?? "").trim();

type EmotionNoteFlowMontageModalProps = {
  montage: EmotionMontage;
  onClose: () => void;
};

export default function EmotionNoteFlowMontageModal({
  montage,
  onClose,
}: EmotionNoteFlowMontageModalProps) {
  const [activePage, setActivePage] = useState(0);
  const [showAtoms, setShowAtoms] = useState(false);
  const atoms = ensureArray<{
    atomId?: string;
    label?: string;
    text?: string;
  }>(montage.atoms_jsonb);

  const sequenceText = ensureArray<{
    atomId?: string;
    label?: string;
    text?: string;
  }>(montage.montage_jsonb?.sequenceText);

  const cutLogicText = ensureArray<{
    from?: string;
    to?: string;
    cutLogic?: string;
    text?: string;
  }>(montage.montage_jsonb?.cutLogicText);

  const freezeFrames = ensureArray<{
    freezeId?: string;
    title?: string;
    dialecticalTension?: string;
    relationsText?: string[];
    whatBecomesVisible?: string;
  }>(montage.freeze_frames_jsonb);

  const hasFreezeFrames = freezeFrames.length > 0;
  const pageCount = hasFreezeFrames ? 3 : 2;
  const handleNextPage = useCallback(() => {
    setActivePage((prev) => Math.min(pageCount - 1, prev + 1));
  }, [pageCount]);
  const handlePrevPage = useCallback(() => {
    setActivePage((prev) => Math.max(0, prev - 1));
  }, []);

  const promptLines = useMemo(() => {
    if (activePage === 2) {
      return [
        "잠깐, 재생을 중지할게요.",
        "재생 중인 기억 장치의 중지(pause) 버튼을 눌렀습니다.",
        "흐름을 정지해봐야 보이는 것도 있어서요.",
      ];
    }
    return [
      "몇몇 기록들을 영상으로 재구성해봤어요.",
      "플로우를 진행하면서 쌓인 기록들이 어떤 장면들을 만들었어요.",
      "다만 이건 분석이나 대안 제시가 아닙니다.",
      "재생(play) 이지요.",
    ];
  }, [activePage]);
  const [leadLine, ...restLines] = promptLines;
  const pageWidth = `${100 / pageCount}%`;
  const pagerWidth = `${pageCount * 100}%`;

  return (
    <div
      className={styles.montageOverlay}
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className={styles.montageCard}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.montageHeader}>
          <div className={styles.montageHeaderTop}>
            <div className={styles.montageHeaderTitle}>
              <p className={styles.montageLabel}>몽타주</p>
              <h3 className={styles.montageTitle}>기억의 몽타주</h3>
            </div>
            <SafeButton
              type="button"
              variant="ghost"
              className={styles.montageClose}
              onClick={onClose}
            >
              <X size={18} />
            </SafeButton>
          </div>
          <div className={styles.montageHeaderPrompt}>
            <CharacterPrompt
              name="EDi"
              greeting={
                <span className={styles.montagePromptText}>
                  <span>{leadLine}</span>
                </span>
              }
            />
          </div>
        </div>
        {restLines.length > 0 ? (
          <div className={styles.montageSubcopy}>
            {restLines.map((line, index) => (
              <p key={`${activePage}-rest-${index}`}>{line}</p>
            ))}
          </div>
        ) : null}
        {activePage > 0 ? (
          <button
            type="button"
            className={`${styles.montageArrow} ${styles.montageArrowLeft}`}
            onClick={handlePrevPage}
            aria-label="이전 페이지"
          >
            <ChevronLeft size={18} />
          </button>
        ) : null}
        {activePage < pageCount - 1 ? (
          <button
            type="button"
            className={styles.montageArrow}
            onClick={handleNextPage}
            aria-label="다음 페이지"
          >
            <ChevronRight size={18} />
          </button>
        ) : null}
        <div className={styles.montageBody}>
          <div className={styles.montagePagerWrap}>
            <div
              className={styles.montagePager}
              style={{
                width: pagerWidth,
                transform: `translateX(-${(activePage * 100) / pageCount}%)`,
              }}
            >
              <div className={styles.montagePage} style={{ width: pageWidth }}>
                <section className={styles.montageSection}>
                  <button
                    type="button"
                    className={styles.montageToggle}
                    onClick={() => setShowAtoms((prev) => !prev)}
                  >
                    <span className={styles.montageSectionTitle}>
                      기억 조각
                    </span>
                    <span className={styles.montageToggleState}>
                      {showAtoms ? "접기" : "펼치기"}
                    </span>
                  </button>
                  {showAtoms ? (
                    atoms.length === 0 ? (
                      <p className={styles.montageEmpty}>
                        표시할 내용이 없습니다.
                      </p>
                    ) : (
                      <div className={styles.montageGrid}>
                        {atoms.map((atom, index) => (
                          <div
                            key={`${atom.atomId ?? "atom"}-${index}`}
                            className={styles.montageChip}
                          >
                            <p className={styles.montageChipTitle}>
                              {normalizeText(atom.label) ||
                                normalizeText(atom.atomId) ||
                                `조각 ${index + 1}`}
                            </p>
                            <p className={styles.montageChipBody}>
                              {normalizeText(atom.text) ||
                                "표시할 내용이 없습니다."}
                            </p>
                          </div>
                        ))}
                      </div>
                    )
                  ) : null}
                </section>

                <section className={styles.montageSection}>
                  <h4 className={styles.montageSectionTitle}>몽타주 시퀀스</h4>
                  {sequenceText.length === 0 ? (
                    <p className={styles.montageEmpty}>
                      표시할 내용이 없습니다.
                    </p>
                  ) : (
                    <div className={styles.sequenceList}>
                      {sequenceText.map((cut, index) => (
                        <div
                          key={`${cut.atomId ?? "cut"}-${index}`}
                          className={styles.sequenceRow}
                        >
                          <div className={styles.sequenceIndex}>
                            {normalizeText(cut.label) || `컷 ${index + 1}`}
                          </div>
                          <div className={styles.sequenceBody}>
                            <p className={styles.sequenceText}>
                              {normalizeText(cut.text) ||
                                "표시할 내용이 없습니다."}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>

              <div className={styles.montagePage} style={{ width: pageWidth }}>
                <section className={styles.montageSection}>
                  <h4 className={styles.montageSectionTitle}>컷 논리</h4>
                  {cutLogicText.length === 0 ? (
                    <p className={styles.montageEmpty}>
                      표시할 내용이 없습니다.
                    </p>
                  ) : (
                    <div className={styles.logicList}>
                      {cutLogicText.map((logic, index) => (
                        <div
                          key={`${logic.from ?? "cut"}-${index}`}
                          className={styles.logicRow}
                        >
                          <div className={styles.logicMeta}>
                            <span>{normalizeText(logic.from) || "컷"}</span>
                            <span className={styles.logicArrow}>→</span>
                            <span>{normalizeText(logic.to) || "컷"}</span>
                            {logic.cutLogic ? (
                              <span className={styles.logicTag}>
                                {normalizeText(logic.cutLogic)}
                              </span>
                            ) : null}
                          </div>
                          <p className={styles.logicText}>
                            {normalizeText(logic.text) ||
                              "표시할 내용이 없습니다."}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
              {hasFreezeFrames ? (
                <div
                  className={styles.montagePage}
                  style={{ width: pageWidth }}
                >
                  <section className={styles.montageSection}>
                    <h4 className={styles.montageSectionTitle}>정지화면</h4>
                    {freezeFrames.length === 0 ? (
                      <p className={styles.montageEmpty}>
                        표시할 내용이 없습니다.
                      </p>
                    ) : (
                      <div className={styles.freezeStack}>
                        {freezeFrames.map((frame, index) => (
                          <div
                            key={`${frame.freezeId ?? "freeze"}-${index}`}
                            className={styles.freezePanel}
                          >
                            <div className={styles.freezeIntro}>
                              <p className={styles.freezeTitle}>
                                {normalizeText(frame.title) ||
                                  `정지화면 ${index + 1}`}
                              </p>
                            </div>

                            <div className={styles.freezeField}>
                              <p className={styles.freezeFieldLabel}>
                                중지된 기억의 단면
                              </p>
                              <p className={styles.freezeFieldValue}>
                                {normalizeText(frame.dialecticalTension) ||
                                  "표시할 내용이 없습니다."}
                              </p>
                            </div>

                            <div className={styles.freezeField}>
                              <p className={styles.freezeFieldLabel}>
                                엿보이는 연관관계
                              </p>
                              {Array.isArray(frame.relationsText) &&
                              frame.relationsText.length > 0 ? (
                                <ul className={styles.freezeFieldList}>
                                  {frame.relationsText.map(
                                    (relation, relationIndex) => (
                                      <li
                                        key={`${
                                          frame.freezeId ?? "relation"
                                        }-${relationIndex}`}
                                        className={styles.freezeFieldListItem}
                                      >
                                        {normalizeText(relation)}
                                      </li>
                                    ),
                                  )}
                                </ul>
                              ) : (
                                <p className={styles.freezeFieldValue}>
                                  표시할 내용이 없습니다.
                                </p>
                              )}
                            </div>

                            <div className={styles.freezeField}>
                              <p className={styles.freezeFieldLabel}>
                                흐릿한 잔상
                              </p>
                              <p className={styles.freezeFieldValue}>
                                {normalizeText(frame.whatBecomesVisible) ||
                                  "표시할 내용이 없습니다."}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
