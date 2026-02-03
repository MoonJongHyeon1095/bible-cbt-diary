import { CbtMinimalStepHeaderSection } from "@/components/cbt/minimal/common/CbtMinimalStepHeaderSection";
import minimalStyles from "@/components/cbt/minimal/MinimalStyles.module.css";
import type { EmotionNote } from "@/lib/types/emotionNoteTypes";
import { Check } from "lucide-react";
import { CbtMinimalFloatingNextButton } from "@/components/cbt/minimal/common/CbtMinimalFloatingNextButton";
import deepStyles from "../DeepStyles.module.css";
import { createPortal } from "react-dom";

type CbtDeepSelectSectionProps = {
  mainNote: EmotionNote;
  selectableNotes: EmotionNote[];
  selectedSubIds: number[];
  selectedCount: number;
  canConfirm: boolean;
  onToggleSub: (id: number) => void;
  onConfirm: () => void;
};

const buildTags = (note: EmotionNote) => {
  const emotion = note.emotion_labels ?? [];
  const errors = note.error_labels ?? [];
  const behaviors = note.behavior_labels ?? [];
  return { emotion, errors, behaviors };
};

const buildCommonTags = (main: EmotionNote, candidate: EmotionNote) => {
  const mainTags = buildTags(main);
  const candidateTags = buildTags(candidate);
  return {
    emotion: candidateTags.emotion.filter((tag) =>
      mainTags.emotion.includes(tag),
    ),
    errors: candidateTags.errors.filter((tag) => mainTags.errors.includes(tag)),
    behaviors: candidateTags.behaviors.filter((tag) =>
      mainTags.behaviors.includes(tag),
    ),
  };
};

export function CbtDeepSelectSection({
  mainNote,
  selectableNotes,
  selectedSubIds,
  selectedCount,
  canConfirm,
  onToggleSub,
  onConfirm,
}: CbtDeepSelectSectionProps) {
  const floatingCount = (
    <div className={deepStyles.selectFloatingCount}>
      선택 {selectedCount}/2 · 최소 1개
    </div>
  );

  const floatingCountPortal =
    typeof document === "undefined"
      ? floatingCount
      : createPortal(floatingCount, document.body);

  return (
    <div className={minimalStyles.section}>
      <div className={minimalStyles.sectionInner}>
        <div className={minimalStyles.headerInset}>
          <CbtMinimalStepHeaderSection
            title="이 기록과 연결할 기록을 선택하세요"
            description="최대 2개까지 선택할 수 있습니다."
          />
        </div>

        <div className={deepStyles.selectBlock}>
          <p className={minimalStyles.sectionLabel}>Main note</p>
          <div className={deepStyles.selectSurface}>
            <div className={deepStyles.selectHeaderRow}>
              <span className={deepStyles.selectTitle}>
                {mainNote.title || "감정 노트"}
              </span>
              <span className={deepStyles.selectMeta}>#{mainNote.id}</span>
            </div>
            <p className={deepStyles.selectText}>{mainNote.trigger_text}</p>
            <div className={deepStyles.selectTagRow}>
              {(mainNote.emotion_labels ?? []).map((label) => (
                <span
                  key={`main-emotion-${label}`}
                  className={`${minimalStyles.tag} ${deepStyles.tagEmotion}`}
                >
                  감정 · {label}
                </span>
              ))}
              {(mainNote.error_labels ?? []).map((label) => (
                <span
                  key={`main-error-${label}`}
                  className={`${minimalStyles.tag} ${deepStyles.tagError}`}
                >
                  오류 · {label}
                </span>
              ))}
              {(mainNote.behavior_labels ?? []).map((label) => (
                <span
                  key={`main-behavior-${label}`}
                  className={`${minimalStyles.tag} ${deepStyles.tagBehavior}`}
                >
                  행동 · {label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className={deepStyles.selectListHeader}>
          <p className={minimalStyles.sectionLabel}>연결할 기록 (최신순)</p>
          <span className={deepStyles.selectCount}>
            {selectableNotes.length}개
          </span>
        </div>
        <div className={deepStyles.selectList}>
          {selectableNotes.length === 0 ? (
            <div className={deepStyles.selectEmpty}>연결할 기록이 없습니다.</div>
          ) : (
            selectableNotes.map((note) => {
              const checked = selectedSubIds.includes(note.id);
              const common = buildCommonTags(mainNote, note);
              const hasCommon =
                common.emotion.length > 0 ||
                common.errors.length > 0 ||
                common.behaviors.length > 0;
              return (
                <button
                  key={note.id}
                  type="button"
                  className={`${deepStyles.selectPick} ${
                    checked ? deepStyles.selectPickActive : ""
                  }`}
                  onClick={() => onToggleSub(note.id)}
                >
                  <div className={deepStyles.selectHeaderRow}>
                    <span className={deepStyles.selectTitle}>
                      {note.title || "감정 노트"}
                    </span>
                    <span className={deepStyles.selectMeta}>#{note.id}</span>
                  </div>
                  <p className={deepStyles.selectText}>{note.trigger_text}</p>
                  <div className={deepStyles.selectTagRow}>
                    {(note.emotion_labels ?? []).map((label) => (
                      <span
                        key={`emotion-${note.id}-${label}`}
                        className={`${minimalStyles.tag} ${deepStyles.tagEmotion}`}
                      >
                        감정 · {label}
                      </span>
                    ))}
                    {(note.error_labels ?? []).map((label) => (
                      <span
                        key={`error-${note.id}-${label}`}
                        className={`${minimalStyles.tag} ${deepStyles.tagError}`}
                      >
                        오류 · {label}
                      </span>
                    ))}
                    {(note.behavior_labels ?? []).map((label) => (
                      <span
                        key={`behavior-${note.id}-${label}`}
                        className={`${minimalStyles.tag} ${deepStyles.tagBehavior}`}
                      >
                        행동 · {label}
                      </span>
                    ))}
                  </div>
                  <div className={deepStyles.selectCommonBlock}>
                    <span className={deepStyles.selectCommonLabel}>
                      공통 요소
                    </span>
                    <div className={deepStyles.selectTagRow}>
                      {common.emotion.map((label) => (
                        <span
                          key={`common-emotion-${note.id}-${label}`}
                          className={`${minimalStyles.tag} ${deepStyles.tagCommon}`}
                        >
                          감정 · {label}
                        </span>
                      ))}
                      {common.errors.map((label) => (
                        <span
                          key={`common-error-${note.id}-${label}`}
                          className={`${minimalStyles.tag} ${deepStyles.tagCommon}`}
                        >
                          오류 · {label}
                        </span>
                      ))}
                      {common.behaviors.map((label) => (
                        <span
                          key={`common-behavior-${note.id}-${label}`}
                          className={`${minimalStyles.tag} ${deepStyles.tagCommon}`}
                        >
                          행동 · {label}
                        </span>
                      ))}
                      {!hasCommon && (
                        <span className={deepStyles.selectCommonEmpty}>
                          공통 요소 없음
                        </span>
                      )}
                    </div>
                  </div>
                  {checked && (
                    <span className={deepStyles.selectCheck}>
                      <Check size={16} />
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
      {floatingCountPortal}
      <CbtMinimalFloatingNextButton
        onClick={onConfirm}
        ariaLabel="이 조합으로 진행하기"
        disabled={!canConfirm}
      />
    </div>
  );
}
