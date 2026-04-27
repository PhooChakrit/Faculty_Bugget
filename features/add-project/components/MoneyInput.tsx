"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";

function formatWithCommas(raw: string): string {
  const stripped = raw.replace(/,/g, "");
  const num = Number(stripped || "0");
  if (isNaN(num)) return raw;
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

interface MoneyInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "onChange" | "type"
> {
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Text input that displays numbers with comma separators (e.g. 1,000,000)
 * while keeping raw numeric strings in form state.
 *
 * - Focused  → shows raw digits for easy editing
 * - Blurred  → shows formatted value with commas
 * - onChange → fires with raw numeric string (commas stripped)
 */
export function MoneyInput({
  value,
  onChange,
  onBlur,
  onFocus,
  readOnly,
  ...props
}: MoneyInputProps) {
  const rawValue = String(value ?? "").replace(/,/g, "");
  const [isFocused, setIsFocused] = useState(false);

  const displayValue = isFocused ? rawValue : formatWithCommas(rawValue);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onChange || readOnly) return;
    let raw = e.target.value.replace(/,/g, "").replace(/[^0-9.]/g, "");
    const parts = raw.split(".");
    if (parts.length > 2) return;
    if (parts.length === 2 && parts[1].length > 2) {
      raw = `${parts[0]}.${parts[1].slice(0, 2)}`;
    }
    // Fire a synthetic event carrying the stripped value
    const syntheticEvent = {
      ...e,
      target: {
        ...e.target,
        value: raw,
        name: e.target.name ?? props.name ?? "",
      },
      currentTarget: {
        ...e.currentTarget,
        value: raw,
        name: e.target.name ?? props.name ?? "",
      },
    } as React.ChangeEvent<HTMLInputElement>;
    onChange(syntheticEvent);
  };

  return (
    <Input
      {...props}
      type="text"
      inputMode="numeric"
      readOnly={readOnly}
      value={displayValue}
      onChange={handleChange}
      onFocus={(e) => {
        setIsFocused(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setIsFocused(false);
        onBlur?.(e);
      }}
      className={`text-right ${props.className ?? ""}`}
    />
  );
}
