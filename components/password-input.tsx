"use client";

import { useState } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  className?: string;
};

export function PasswordInput({ value, onChange, placeholder, required, minLength, className }: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        required={required}
        minLength={minLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${className ?? ""} pr-11`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink text-xs font-bold"
        aria-label={visible ? "Skrýt heslo" : "Zobrazit heslo"}
      >
        {visible ? "SKRÝT" : "UKÁZAT"}
      </button>
    </div>
  );
}
