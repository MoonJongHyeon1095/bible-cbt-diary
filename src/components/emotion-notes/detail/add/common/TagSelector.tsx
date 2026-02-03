"use client";

import styles from "./TagSelector.module.css";
import SafeButton from "@/components/ui/SafeButton";

interface TagOption {
  id: string;
  label: string;
  colorClassName?: string;
}

interface TagSelectorProps {
  options: TagOption[];
  value: string;
  onSelect: (value: string) => void;
  selectedClassName?: string;
  unselectedClassName?: string;
  useOptionColor?: boolean;
}

export function TagSelector({
  options,
  value,
  onSelect,
  selectedClassName,
  unselectedClassName,
  useOptionColor = false,
}: TagSelectorProps) {
  const parseColorClass = (colorClassName?: string) => {
    if (!colorClassName) return {};
    const tokens = colorClassName.split(" ");
    const vars: Record<string, string> = {};
    const colorMap: Record<string, Record<string, string>> = {
      blue: { "50": "#eff6ff", "300": "#93c5fd", "500": "#3b82f6" },
      red: { "50": "#fef2f2", "300": "#fca5a5", "500": "#ef4444" },
      purple: { "50": "#faf5ff", "300": "#d8b4fe", "500": "#a855f7" },
      green: { "50": "#f0fdf4", "300": "#86efac", "500": "#22c55e" },
      rose: { "50": "#fff1f2", "300": "#fda4af", "500": "#f43f5e" },
      pink: { "50": "#fdf2f8", "300": "#f9a8d4", "500": "#ec4899" },
      indigo: { "50": "#eef2ff", "300": "#a5b4fc", "500": "#6366f1" },
      slate: { "50": "#f8fafc", "400": "#94a3b8", "600": "#475569" },
      amber: { "50": "#fffbeb", "300": "#fcd34d", "500": "#f59e0b" },
      orange: { "50": "#fff7ed", "300": "#fdba74", "500": "#f97316" },
      yellow: { "50": "#fefce8", "300": "#fde047", "500": "#eab308" },
    };

    const resolve = (token: string) => {
      const [prefix, color, shade] = token.split("-");
      if (!prefix || !color || !shade) return null;
      const value = colorMap[color]?.[shade];
      return value ? { prefix, value } : null;
    };

    tokens.forEach((token) => {
      if (token.startsWith("bg-")) {
        const result = resolve(token.replace("bg-", "bg-"));
        if (result) vars["--tag-bg"] = result.value;
      }
      if (token.startsWith("border-")) {
        const result = resolve(token.replace("border-", "border-"));
        if (result) vars["--tag-border"] = result.value;
      }
      if (token.startsWith("hover:border-")) {
        const raw = token.replace("hover:border-", "border-");
        const result = resolve(raw);
        if (result) vars["--tag-hover"] = result.value;
      }
      if (token.startsWith("text-")) {
        const result = resolve(token.replace("text-", "text-"));
        if (result) vars["--tag-text"] = result.value;
      }
    });

    vars["--tag-selected-border"] = vars["--tag-border"] ?? "#94a3b8";
    vars["--tag-selected-bg"] = vars["--tag-bg"] ?? "#f1f5f9";
    vars["--tag-selected-text"] = vars["--tag-text"] ?? "#0f172a";
    return vars;
  };

  return (
    <div className={styles.container}>
      {options.map((option) => {
        const selected = value === option.label;
        const selectedClass = useOptionColor
          ? styles.selected
          : selectedClassName ?? "";
        const baseClass = selected
          ? selectedClass
          : unselectedClassName ?? "";
        const optionVars =
          useOptionColor && selected
            ? parseColorClass(option.colorClassName)
            : undefined;

        return (
          <SafeButton mode="native"
            key={option.id}
            type="button"
            onClick={() => onSelect(option.label)}
            style={optionVars}
            className={[styles.button, baseClass].filter(Boolean).join(" ")}
          >
            {option.label}
          </SafeButton>
        );
      })}
    </div>
  );
}
