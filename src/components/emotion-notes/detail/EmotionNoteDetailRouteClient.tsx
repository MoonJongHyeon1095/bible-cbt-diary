"use client";

import OnboardingTour from "@/components/onboarding/OnboardingTour";
import {
  consumeDetailConfettiPending,
  DETAIL_TOUR_STEPS,
  UNIFIED_DETAIL_TOUR_OFFSET,
} from "@/components/onboarding/unifiedOnboarding";
import { useUnifiedOnboardingSegment } from "@/components/onboarding/hooks/useUnifiedOnboardingSegment";
import { useCbtToast } from "@/components/session/common/CbtToast";
import { useGate } from "@/components/gate/GateProvider";
import { useEffect } from "react";
import EmotionNoteDetailPage from "@/components/emotion-notes/detail/EmotionNoteDetailPage";
import { useSearchParams } from "next/navigation";

export default function EmotionNoteDetailRouteClient() {
  const searchParams = useSearchParams();
  const { pushToast } = useCbtToast();
  const { blocker, canShowOnboarding } = useGate();
  const idParam = searchParams.get("id");
  const noteId = idParam ? Number(idParam) : null;
  const resolvedNoteId = noteId && !Number.isNaN(noteId) ? noteId : null;
  const {
    isOpen: isTourOpen,
    setIsOpen: setTourOpen,
    currentStep,
    setCurrentStep,
    onFinish,
    onClose,
    onMaskClick,
    progress: detailTourProgress,
  } = useUnifiedOnboardingSegment({
    steps: DETAIL_TOUR_STEPS,
    offset: UNIFIED_DETAIL_TOUR_OFFSET,
    canShow: canShowOnboarding,
    blocked: Boolean(blocker),
  });

  useEffect(() => {
    if (!isTourOpen || currentStep !== 0) return;
    const shouldCelebrate = consumeDetailConfettiPending();
    if (!shouldCelebrate) {
      return;
    }
    pushToast("첫 노트 생성 축하드려요!", "success");
    void import("canvas-confetti")
      .then((mod) => {
        const fire = mod.default;
        fire({
          particleCount: 90,
          angle: 60,
          spread: 62,
          startVelocity: 48,
          gravity: 0.9,
          zIndex: 2147483647,
          origin: { x: 0.15, y: 0.95 },
        });
        window.setTimeout(() => {
          fire({
            particleCount: 90,
            angle: 120,
            spread: 62,
            startVelocity: 48,
            gravity: 0.9,
            zIndex: 2147483647,
            origin: { x: 0.85, y: 0.95 },
          });
        }, 250);
      })
      .catch(() => {
        // noop
      });
  }, [currentStep, isTourOpen, pushToast]);

  return (
    <>
      <EmotionNoteDetailPage
        noteId={resolvedNoteId}
        hideFloatingActions={false}
      />
      <OnboardingTour
        steps={DETAIL_TOUR_STEPS}
        isOpen={isTourOpen}
        setIsOpen={setTourOpen}
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        progress={detailTourProgress}
        onFinish={onFinish}
        onClose={onClose}
        onMaskClick={onMaskClick}
      />
    </>
  );
}
