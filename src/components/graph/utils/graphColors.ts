"use client";

export type ThemeColor = {
  rgb: [number, number, number];
  rgbString: string;
};

const hslToRgb = (h: number, s: number, l: number) => {
  const hue = ((h % 360) + 360) % 360;
  const sat = Math.max(0, Math.min(100, s)) / 100;
  const light = Math.max(0, Math.min(100, l)) / 100;

  if (sat === 0) {
    const gray = Math.round(light * 255);
    return [gray, gray, gray] as [number, number, number];
  }

  const c = (1 - Math.abs(2 * light - 1)) * sat;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = light - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (hue < 60) {
    r = c;
    g = x;
  } else if (hue < 120) {
    r = x;
    g = c;
  } else if (hue < 180) {
    g = c;
    b = x;
  } else if (hue < 240) {
    g = x;
    b = c;
  } else if (hue < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }

  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ] as [number, number, number];
};

export const getFlowThemeColor = (flowId: number) => {
  const hue = (flowId * 137.508) % 360;
  const rgb = hslToRgb(hue, 68, 56);
  return {
    rgb,
    rgbString: `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`,
  } satisfies ThemeColor;
};
