"use client";

import { Search } from "lucide-react";
import type { KeyboardEvent } from "react";
import styles from "./SearchInputField.module.css";

type SearchInputFieldProps = {
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  id?: string;
  className?: string;
};

export default function SearchInputField({
  value,
  placeholder,
  onChange,
  onSubmit,
  id,
  className,
}: SearchInputFieldProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) return;
    if (event.key !== "Enter") return;
    event.preventDefault();
    onSubmit();
  };

  return (
    <div className={[styles.searchField, className].filter(Boolean).join(" ")}>
      <Search size={16} aria-hidden className={styles.searchIcon} />
      <input
        id={id}
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        className={styles.searchInput}
      />
    </div>
  );
}
