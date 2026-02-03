let perfCounter = 0;

export function startPerf(label: string) {
  perfCounter += 1;
  const tag = `[perf] ${label} #${perfCounter}`;
  if (typeof console !== "undefined" && console.time) {
    console.time(tag);
  }
  return () => {
    if (typeof console !== "undefined" && console.timeEnd) {
      console.timeEnd(tag);
    }
  };
}
