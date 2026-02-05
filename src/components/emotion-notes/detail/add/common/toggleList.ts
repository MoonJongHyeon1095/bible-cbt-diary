type ToggleOptions = {
  max?: number;
};

export type ToggleResult<T> = {
  next: T[];
  overflowed: boolean;
  changed: boolean;
};

export const toggleListValue = <T>(
  prev: T[],
  value: T,
  options?: ToggleOptions,
): ToggleResult<T> => {
  const exists = prev.includes(value);
  if (exists) {
    const next = prev.filter((item) => item !== value);
    return { next, overflowed: false, changed: true };
  }
  const max = options?.max ?? 0;
  if (max > 0 && prev.length >= max) {
    return { next: prev, overflowed: true, changed: false };
  }
  return { next: [...prev, value], overflowed: false, changed: true };
};
