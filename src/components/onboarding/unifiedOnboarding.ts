import type { OnboardingStep } from "@/components/onboarding/OnboardingTour";
import type { MinimalStep } from "@/components/session/hooks/useCbtMinimalSessionFlow";
import { safeLocalStorage } from "@/lib/storage/core/safeStorage";
import { UNIFIED_TOUR_STORAGE_KEY as UNIFIED_ONBOARDING_KEY } from "@/lib/storage/keys/onboarding";

export const UNIFIED_TOUR_STORAGE_KEY = UNIFIED_ONBOARDING_KEY;

export type UnifiedTourProgress = {
  lastStep: number;
  lastTotal: number;
  detailConfettiPending?: boolean;
  detailConfettiShown?: boolean;
};

export const readUnifiedTourProgress = (): UnifiedTourProgress | null => {
  if (!safeLocalStorage.isAvailable()) return null;
  const stored = safeLocalStorage.getItem(UNIFIED_TOUR_STORAGE_KEY);
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored) as Partial<UnifiedTourProgress>;
    if (
      typeof parsed.lastStep !== "number" ||
      Number.isNaN(parsed.lastStep) ||
      typeof parsed.lastTotal !== "number" ||
      Number.isNaN(parsed.lastTotal)
    ) {
      return null;
    }
    return {
      lastStep: parsed.lastStep,
      lastTotal: parsed.lastTotal,
      detailConfettiPending: Boolean(parsed.detailConfettiPending),
      detailConfettiShown: Boolean(parsed.detailConfettiShown),
    };
  } catch {
    return null;
  }
};

export const writeUnifiedTourProgress = (next: UnifiedTourProgress) => {
  if (!safeLocalStorage.isAvailable()) return;
  safeLocalStorage.setItem(UNIFIED_TOUR_STORAGE_KEY, JSON.stringify(next));
};

export const persistUnifiedTourProgress = (
  lastStep: number,
  lastTotal: number,
) => {
  const prev = readUnifiedTourProgress();
  const nextStep = Math.max(
    prev?.lastStep ?? -1,
    Math.max(0, Math.floor(lastStep)),
  );
  const nextTotal = Math.max(
    prev?.lastTotal ?? 0,
    Math.max(0, Math.floor(lastTotal)),
  );
  writeUnifiedTourProgress({
    lastStep: nextStep,
    lastTotal: nextTotal,
    detailConfettiPending: prev?.detailConfettiPending ?? false,
    detailConfettiShown: prev?.detailConfettiShown ?? false,
  });
};

export const resolveUnifiedSegmentStartStep = (
  offset: number,
  stepCount: number,
) => {
  if (stepCount <= 0) return null;
  const progress = readUnifiedTourProgress();
  if (!progress) {
    return offset === 0 ? 0 : null;
  }
  if (progress.lastStep >= UNIFIED_TOUR_BASE_TOTAL - 1) return null;
  const nextGlobalStep = Math.max(
    0,
    Math.min(progress.lastStep + 1, UNIFIED_TOUR_BASE_TOTAL - 1),
  );
  const localStep = nextGlobalStep - offset;
  if (localStep < 0 || localStep >= stepCount) return null;
  return localStep;
};

export const markDetailConfettiPending = () => {
  const prev = readUnifiedTourProgress();
  if (!prev || prev.detailConfettiShown) return;
  writeUnifiedTourProgress({
    ...prev,
    detailConfettiPending: true,
  });
};

export const consumeDetailConfettiPending = () => {
  const prev = readUnifiedTourProgress();
  if (!prev) return false;
  const shouldCelebrate =
    !prev.detailConfettiShown &&
    (prev.detailConfettiPending ||
      prev.lastStep === UNIFIED_DETAIL_CELEBRATION_STEP ||
      (prev.lastStep >= MINIMAL_TOUR_TOTAL - 1 &&
        prev.lastStep < UNIFIED_DETAIL_TOUR_OFFSET));
  if (!shouldCelebrate) return false;
  writeUnifiedTourProgress({
    ...prev,
    lastStep: Math.max(prev.lastStep, UNIFIED_DETAIL_CELEBRATION_STEP),
    detailConfettiPending: false,
    detailConfettiShown: true,
  });
  return true;
};

export const MINIMAL_TOUR_STEP_ORDER: MinimalStep[] = [
  "mood",
  "emotion",
  "incident",
  "distortion",
  "alternative",
];

export const MINIMAL_TOUR_STEPS_BY_FLOW: Record<MinimalStep, OnboardingStep[]> =
  {
    mood: [
      {
        selector:
          "[data-tour='home-mood-toggle'], [data-tour='session-mood-toggle']",
        side: "bottom",
        content: "오늘 기분을 골라보죠. \n아주 단순하게 좋은지 나쁜지로.",
      },
    ],
    emotion: [
      {
        selector: "[data-tour='home-emotion-grid'], [data-tour='emotion-grid']",
        side: "bottom",
        content: "지금의 감정에 가장 가까운 것을 골라주세요.",
        completeOnTargetClick: true,
      },
    ],
    incident: [
      {
        selector: "[data-tour='minimal-incident-input']",
        side: "bottom",
        content: "오늘 있었던 일을 간단히 적어주세요.",
      },
      {
        selector: "[data-tour='minimal-incident-example']",
        side: "bottom",
        content: "직접 적을 수도, 예시를 볼 수도 있어요.",
      },
      {
        selector: "[data-tour='minimal-incident-next']",
        side: "bottom",
        content: "이 이야기를 바탕으로 다음 단계로 넘어가요.",
      },
    ],
    distortion: [
      {
        selector: "[data-tour='minimal-distortion-list']",
        side: "bottom",
        content: "감정 뒤에 혹시 있었을지 모르는 생각이에요.",
      },
      {
        selector: "[data-tour='minimal-distortion-more']",
        side: "bottom",
        content: "다른 생각을 더 보려면 여기를 눌러보세요.",
      },
    ],
    alternative: [],
  };

export const MINIMAL_TOUR_TOTAL = MINIMAL_TOUR_STEP_ORDER.reduce(
  (total, step) => total + MINIMAL_TOUR_STEPS_BY_FLOW[step].length,
  0,
);

// Global step indices (0-based):
// 0..6 minimal onboarding (display 1..7)
// 7..10 detail onboarding (display 8..11)
export const UNIFIED_DETAIL_CELEBRATION_STEP = 7;
export const UNIFIED_DETAIL_TOUR_OFFSET = 7;
export const DETAIL_TOUR_STEPS: OnboardingStep[] = [
  {
    content: "첫 노트 생성 축하드려요!",
    side: "bottom",
    align: "center",
  },
  {
    selector: "[data-tour='detail-memory-box']",
    side: "bottom",
    content: "이 곳은 기억을 보관하는 방입니다.",
  },
  {
    selector: "[data-tour='detail-alternative-box']",
    side: "bottom",
    content: "방금 고른 생각도 이곳에 저장되어 있네요.",
    hidePopoverDuringScroll: true,
  },
];

export const UNIFIED_TOUR_BASE_TOTAL =
  UNIFIED_DETAIL_TOUR_OFFSET + DETAIL_TOUR_STEPS.length;

export const getMinimalTourOffset = (step: MinimalStep) => {
  let offset = 0;
  for (const key of MINIMAL_TOUR_STEP_ORDER) {
    if (key === step) break;
    offset += MINIMAL_TOUR_STEPS_BY_FLOW[key].length;
  }
  return offset;
};
