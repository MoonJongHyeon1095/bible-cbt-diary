"use client";

import {
  CbtToastProvider,
  useCbtToast,
} from "@/components/cbt/common/CbtToast";
import { useCbtAccess } from "@/components/cbt/hooks/useCbtAccess";
import {
  saveMinimalPatternAPI,
  saveSessionHistoryAPI,
} from "@/components/cbt/utils/api";
import { clearCbtSessionStorage } from "@/components/cbt/utils/storage/cbtSessionStorage";
import { flushTokenSessionUsage } from "@/lib/utils/tokenSessionStorage";
import type {
  EmotionThoughtPair,
  SelectedCognitiveError,
  SessionHistory,
} from "@/lib/types/cbtTypes";
import { formatKoreanDateTime } from "@/lib/utils/time";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { MinimalAutoThoughtSection } from "./minimal/center/MinimalAutoThoughtSection";
import { MinimalEmotionSection } from "./minimal/center/MinimalEmotionSection";
import { MinimalIncidentSection } from "./minimal/center/MinimalIncidentSection";
import { MinimalFloatingBackButton } from "./minimal/common/MinimalFloatingBackButton";
import { MinimalFloatingHomeButton } from "./minimal/common/MinimalFloatingHomeButton";
import { MinimalSavingModal } from "./minimal/common/MinimalSavingModal";
import { MinimalCognitiveErrorSection } from "./minimal/left/MinimalCognitiveErrorSection";
import styles from "./minimal/MinimalStyles.module.css";
import { MinimalAlternativeThoughtSection } from "./minimal/right/MinimalAlternativeThoughtSection";

type MinimalStep =
  | "incident"
  | "emotion"
  | "thought"
  | "errors"
  | "alternative";

function SessionPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { pushToast } = useCbtToast();
  const [step, setStep] = useState<MinimalStep>("incident");
  const [userInput, setUserInput] = useState("");
  const [selectedEmotion, setSelectedEmotion] = useState("");
  const [emotionThoughtPairs, setEmotionThoughtPairs] = useState<
    EmotionThoughtPair[]
  >([]);
  const [selectedCognitiveErrors, setSelectedCognitiveErrors] = useState<
    SelectedCognitiveError[]
  >([]);
  const [autoThoughtWantsCustom, setAutoThoughtWantsCustom] = useState(false);
  const [alternativeSeed, setAlternativeSeed] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const lastErrorsKeyRef = useRef<string>("");
  const { requireAccessContext } = useCbtAccess({
    setError: (message) => {
      pushToast(message, "error");
    },
  });
  const dateParam = searchParams.get("date");
  const hasDateParam = Boolean(
    dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam),
  );
  const dateLabel = hasDateParam
    ? formatKoreanDateTime(`${dateParam}T00:00:00+09:00`, {
        month: "long",
        day: "numeric",
      })
    : "";
  const incidentTitle = hasDateParam
    ? `${dateLabel}에 무슨 일이 있었나요?`
    : "오늘 무슨 일이 있었나요?";

  const stepOrder: MinimalStep[] = [
    "incident",
    "emotion",
    "thought",
    "errors",
    "alternative",
  ];
  const currentStepIndex = stepOrder.indexOf(step);

  useEffect(() => {
    const handlePageHide = () => {
      void flushTokenSessionUsage();
    };
    window.addEventListener("pagehide", handlePageHide);
    return () => {
      window.removeEventListener("pagehide", handlePageHide);
      void flushTokenSessionUsage();
    };
  }, []);

  const handleBack = () => {
    if (currentStepIndex <= 0) return;
    if (step === "thought" && autoThoughtWantsCustom) {
      setAutoThoughtWantsCustom(false);
      return;
    }
    setStep(stepOrder[currentStepIndex - 1]);
  };

  const handleGoHome = () => {
    clearCbtSessionStorage();
    router.push("/today");
  };

  const handleSubmitThought = (thought: string) => {
    const nextPair: EmotionThoughtPair = {
      emotion: selectedEmotion,
      intensity: null,
      thought,
    };
    setEmotionThoughtPairs([nextPair]);
    setStep("errors");
  };

  const handleSelectErrors = (errors: SelectedCognitiveError[]) => {
    const nextKey = JSON.stringify(
      errors.map((item) => ({
        id: item.id,
        index: item.index,
        title: item.title,
        detail: item.detail,
      })),
    );
    if (nextKey !== lastErrorsKeyRef.current) {
      setAlternativeSeed((prev) => prev + 1);
      lastErrorsKeyRef.current = nextKey;
    }
    setSelectedCognitiveErrors(errors);
    setStep("alternative");
  };

  const handleComplete = async (thought: string) => {
    if (isSaving) return;
    const access = await requireAccessContext();
    if (!access) return;

    const pairsToSave = emotionThoughtPairs.map((pair) => ({
      ...pair,
      intensity: null,
    }));

    const historyItem: SessionHistory = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      userInput,
      emotionThoughtPairs: pairsToSave,
      selectedCognitiveErrors,
      selectedAlternativeThought: thought,
      selectedBehavior: null,
      bibleVerse: null,
    };

    const minimalPayload = {
      triggerText: userInput,
      emotion: selectedEmotion,
      automaticThought: emotionThoughtPairs[0]?.thought ?? "",
      alternativeThought: thought,
      cognitiveError: selectedCognitiveErrors[0] ?? null,
    };

    setIsSaving(true);

    try {
      const { ok, payload } = await saveMinimalPatternAPI(
        access,
        minimalPayload,
      );
      if (!ok) {
        throw new Error("save_minimal_note_failed");
      }

      const historyResult = await saveSessionHistoryAPI(access, historyItem);
      if (!historyResult.ok) {
        throw new Error("save_session_history_failed");
      }

      const noteId = payload?.noteId;
      if (!noteId) {
        throw new Error("note_id_missing");
      }

      pushToast("세션 기록이 저장되었습니다.", "success");
      window.setTimeout(() => {
        void flushTokenSessionUsage({ sessionCount: 1 });
        clearCbtSessionStorage();
        router.push(`/detail/${noteId}`);
      }, 180);
    } catch (error) {
      console.error("세션 저장 실패:", error);
      pushToast("세션 기록을 저장하지 못했습니다.", "error");
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.bgWaves} />
      <div className={styles.content}>
        <MinimalSavingModal open={isSaving} />
        {currentStepIndex > 0 && (
          <div className={`${styles.floatingNav} ${styles.left}`}>
            <MinimalFloatingBackButton onClick={handleBack} />
          </div>
        )}
        <div className={`${styles.floatingNav} ${styles.right}`}>
          <MinimalFloatingHomeButton onClick={handleGoHome} />
        </div>

        {step === "incident" && (
          <MinimalIncidentSection
            userInput={userInput}
            onInputChange={setUserInput}
            onNext={() => setStep("emotion")}
            title={incidentTitle}
          />
        )}

        {step === "emotion" && (
          <MinimalEmotionSection
            selectedEmotion={selectedEmotion}
            onSelectEmotion={setSelectedEmotion}
            onNext={() => {
              setAutoThoughtWantsCustom(false);
              setStep("thought");
            }}
          />
        )}

        {step === "thought" && (
          <MinimalAutoThoughtSection
            userInput={userInput}
            emotion={selectedEmotion}
            wantsCustom={autoThoughtWantsCustom}
            onWantsCustomChange={setAutoThoughtWantsCustom}
            onSubmitThought={handleSubmitThought}
          />
        )}

        {step === "errors" && (
          <MinimalCognitiveErrorSection
            userInput={userInput}
            thought={emotionThoughtPairs[0]?.thought ?? ""}
            onSelect={handleSelectErrors}
          />
        )}

        {step === "alternative" && (
          <MinimalAlternativeThoughtSection
            userInput={userInput}
            emotionThoughtPairs={emotionThoughtPairs}
            selectedCognitiveErrors={selectedCognitiveErrors}
            seed={alternativeSeed}
            onSelect={handleComplete}
          />
        )}
      </div>
    </div>
  );
}

export default function SessionPage() {
  return (
    <CbtToastProvider>
      <SessionPageContent />
    </CbtToastProvider>
  );
}
