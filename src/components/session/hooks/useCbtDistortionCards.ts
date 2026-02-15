import {
  generateDistortionCard,
} from "@/lib/ai";
import { COGNITIVE_ERRORS } from "@/lib/constants/errors";
import type { SelectedCognitiveError } from "@/lib/types/sessionTypes";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DistortionCard } from "../types/distortion";

const buildCardId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const pickRandomError = (excluded: Set<string>) => {
  const pool = COGNITIVE_ERRORS.filter((item) => !excluded.has(item.id));
  if (pool.length === 0) return null;
  const picked = pool[Math.floor(Math.random() * pool.length)];
  return picked;
};

const toSelectedError = (card: DistortionCard): SelectedCognitiveError => ({
  id: card.errorId,
  title: card.errorTitle,
  detail: card.analysis,
});

export function useCbtDistortionCards({
  userInput,
  emotion,
}: {
  userInput: string;
  emotion: string;
}) {
  const [cards, setCards] = useState<DistortionCard[]>([]);
  const cardsRef = useRef<DistortionCard[]>([]);
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
                  analysis: "",
                  emotionReason: "",
                  errorMessage: null,
                  isGenerating: true,
                },
        ),
      );

      const generation = (generationMapRef.current[cardId] ?? 0) + 1;
      generationMapRef.current[cardId] = generation;

      const readCurrent = () => generationMapRef.current[cardId] === generation;
      const targetCard = cardsRef.current.find((item) => item.cardId === cardId);
      if (!targetCard) return;

      try {
        const result = await generateDistortionCard(
          userInput,
          emotion,
          targetCard.errorTitle,
          hint,
        );

        if (!readCurrent()) return;

        const belief = result.innerBelief.trim();
        const analysis = result.analysis.trim();
        const emotionReason = result.emotionReason.trim();

        setCards((prev) =>
          prev.map((card) =>
            card.cardId !== cardId
              ? card
              : {
                  ...card,
                  innerBelief: belief,
                  analysis,
                  emotionReason,
                  isGenerating: false,
                },
          ),
        );
      } catch (error) {
        if (!readCurrent()) return;
        console.error("distortion card generation failed:", error);
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

    const excluded = new Set(cardsRef.current.map((card) => card.errorId));
    const next = pickRandomError(excluded);
    if (!next) return;

    const cardId = buildCardId();
    const card: DistortionCard = {
      cardId,
      errorId: next.id,
      errorTitle: next.title,
      errorDescription: next.description,
      innerBelief: "",
      analysis: "",
      emotionReason: "",
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
    () => cards.length < COGNITIVE_ERRORS.length,
    [cards.length],
  );

  return {
    cards,
    canLoadMore,
    addCard,
    regenerateCard,
    toSelectedError,
  };
}
