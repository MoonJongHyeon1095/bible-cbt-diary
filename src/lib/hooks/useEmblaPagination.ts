import { useEffect, useMemo, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";

type UseEmblaPaginationOptions = {
  slidesCount: number;
  draggable?: boolean;
  selectedIndex?: number;
  onSelectIndex?: (index: number) => void;
};

export function useEmblaPagination({
  slidesCount,
  draggable = true,
  selectedIndex,
  onSelectIndex,
}: UseEmblaPaginationOptions) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    watchDrag: draggable,
  });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const [internalIndex, setInternalIndex] = useState(0);
  const onSelectIndexRef = useRef(onSelectIndex);

  useEffect(() => {
    onSelectIndexRef.current = onSelectIndex;
  }, [onSelectIndex]);

  const currentIndex = selectedIndex ?? internalIndex;

  useEffect(() => {
    if (!emblaApi) return;
    const update = () => {
      const index = emblaApi.selectedScrollSnap();
      setCanPrev(emblaApi.canScrollPrev());
      setCanNext(emblaApi.canScrollNext());
      setInternalIndex(index);
      onSelectIndexRef.current?.(index);
    };
    emblaApi.on("select", update);
    emblaApi.on("reInit", update);
    update();
    return () => {
      emblaApi.off("select", update);
      emblaApi.off("reInit", update);
    };
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.reInit();
  }, [emblaApi, slidesCount]);

  useEffect(() => {
    if (!emblaApi) return;
    if (!Number.isFinite(currentIndex)) return;
    emblaApi.scrollTo(currentIndex, true);
  }, [currentIndex, emblaApi]);

  const controls = useMemo(
    () => ({
      canPrev,
      canNext,
      scrollPrev: () => emblaApi?.scrollPrev(),
      scrollNext: () => emblaApi?.scrollNext(),
      scrollTo: (index: number) => emblaApi?.scrollTo(index, true),
    }),
    [canNext, canPrev, emblaApi],
  );

  return { emblaRef, currentIndex, controls };
}
