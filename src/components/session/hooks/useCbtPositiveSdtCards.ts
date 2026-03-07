import { generatePositiveSdtCard } from "@/lib/ai";
import { SDT_NEEDS, type SdtKey } from "@/lib/constants/sdt";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SdtCard } from "../types/sdt";

const buildCardId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const pickRandomSdt = (excluded: Set<SdtKey>) => {
  const pool = SDT_NEEDS.filter((item) => !excluded.has(item.key));
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
};

export function useCbtPositiveSdtCards({
  userInput,
  emotion,
}: {
  userInput: string;
  emotion: string;
}) {
  const [cards, setCards] = useState<SdtCard[]>([]);
  const cardsRef = useRef<SdtCard[]>([]);
  const generationMapRef = useRef<Record<string, number>>({});
  const baseReady = Boolean(userInput.trim() && emotion.trim());

  const runCardGeneration = useCallback(
    async (cardId: string, hint?: string) => {
      setCards((prev) =>
        prev.map((card) =>
          card.cardId !== cardId
            ? card
            : {
                ...card,
                innerBelief: "",
                empathyText: "",
                behaviorLabel: "",
                behaviorDescription: "",
                behaviorChecklist: [],
                reflectionQuestion: "",
                errorMessage: null,
                isGenerating: true,
              },
        ),
      );

      const generation = (generationMapRef.current[cardId] ?? 0) + 1;
      generationMapRef.current[cardId] = generation;
      const isCurrent = () => generationMapRef.current[cardId] === generation;
      const targetCard = cardsRef.current.find((item) => item.cardId === cardId);
      if (!targetCard) return;

      try {
        const result = await generatePositiveSdtCard(
          userInput,
          emotion,
          targetCard.sdtType,
          hint,
        );

        if (!isCurrent()) return;

        setCards((prev) =>
          prev.map((card) =>
            card.cardId !== cardId
              ? card
              : {
                  ...card,
                  innerBelief: result.innerBelief.trim(),
                  empathyText: result.empathyText.trim(),
                  behaviorLabel: result.behaviorLabel.trim(),
                  behaviorDescription: result.behaviorDescription.trim(),
                  behaviorChecklist: result.behaviorChecklist,
                  reflectionQuestion: result.reflectionQuestion.trim(),
                  isGenerating: false,
                },
          ),
        );
      } catch (error) {
        if (!isCurrent()) return;
        console.error("positive sdt card generation failed:", error);
        setCards((prev) =>
          prev.map((card) =>
            card.cardId !== cardId
              ? card
              : {
                  ...card,
                  isGenerating: false,
                  errorMessage: "생성 중 오류가 발생했습니다.",
                },
          ),
        );
      }
    },
    [emotion, userInput],
  );

  const addCard = useCallback(() => {
    if (!baseReady) return;

    const excluded = new Set(cardsRef.current.map((card) => card.sdtType));
    const next = pickRandomSdt(excluded);
    if (!next) return;

    const cardId = buildCardId();
    const card: SdtCard = {
      cardId,
      sdtType: next.key,
      sdtLabel: next.label,
      sdtSummary: next.summary,
      sdtDescription: next.description,
      innerBelief: "",
      empathyText: "",
      behaviorLabel: "",
      behaviorDescription: "",
      behaviorChecklist: [],
      reflectionQuestion: "",
      isGenerating: false,
      errorMessage: null,
    };

    setCards((prev) => [...prev, card]);
    cardsRef.current = [...cardsRef.current, card];
    void runCardGeneration(cardId);
  }, [baseReady, runCardGeneration]);

  const regenerateCard = useCallback(
    async (cardId: string, hint?: string) => {
      await runCardGeneration(cardId, hint);
    },
    [runCardGeneration],
  );

  useEffect(() => {
    cardsRef.current = cards;
  }, [cards]);

  useEffect(() => {
    setCards([]);
    cardsRef.current = [];
    generationMapRef.current = {};
    if (!baseReady) return;

    const timer = window.setTimeout(() => {
      addCard();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [addCard, baseReady, emotion, userInput]);

  const canLoadMore = useMemo(
    () => cards.length < SDT_NEEDS.length,
    [cards.length],
  );

  return {
    cards,
    canLoadMore,
    addCard,
    regenerateCard,
  };
}
