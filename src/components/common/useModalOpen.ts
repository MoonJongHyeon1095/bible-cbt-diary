import { useEffect, useRef } from "react";

let openCount = 0;

const updateBodyFlag = () => {
  if (typeof document === "undefined") return;
  if (openCount > 0) {
    document.body.dataset.modalOpen = "true";
  } else {
    delete document.body.dataset.modalOpen;
  }
};

export const useModalOpen = (isOpen: boolean) => {
  const isTrackedRef = useRef(false);

  useEffect(() => {
    if (isOpen && !isTrackedRef.current) {
      openCount += 1;
      isTrackedRef.current = true;
      updateBodyFlag();
    }

    if (!isOpen && isTrackedRef.current) {
      openCount = Math.max(0, openCount - 1);
      isTrackedRef.current = false;
      updateBodyFlag();
    }

    return () => {
      if (isTrackedRef.current) {
        openCount = Math.max(0, openCount - 1);
        isTrackedRef.current = false;
        updateBodyFlag();
      }
    };
  }, [isOpen]);
};
