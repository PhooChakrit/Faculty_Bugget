"use client";

import { useState } from "react";

interface MultiSelectProps {
  label: string;
  options: { value: string; label: string }[];
  value?: string[];
  onChange?: (values: string[]) => void;
  required?: boolean;
  hint?: string;
  maxSelections?: number;
}

export default function MultiSelect({
  label,
  options,
  value = [],
  onChange,
  required = false,
  hint,
  maxSelections,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOption = (optValue: string) => {
    if (value.includes(optValue)) {
      onChange?.(value.filter((v) => v !== optValue));
    } else {
      if (maxSelections && value.length >= maxSelections) {
        return; // Max reached
      }
      onChange?.([...value, optValue]);
    }
  };

  const removeTag = (optValue: string) => {
    onChange?.(value.filter((v) => v !== optValue));
  };

  const selectedLabels = options
    .filter((opt) => value.includes(opt.value))
    .map((opt) => ({ value: opt.value, label: opt.label }));

  return (
    <div className="form-group">
      <label className="form-label">
        {label}
        {required && <span className="required">*</span>}
      </label>
      {hint && <div className="form-hint">{hint}</div>}

      <div className="multi-select">
        <div
          className="multi-select-tags"
          onClick={() => setIsOpen(!isOpen)}
          style={{ cursor: "pointer" }}
        >
          {selectedLabels.length === 0 ? (
            <span style={{ color: "#9ca3af", padding: "4px" }}>
              เลือก{label}...
            </span>
          ) : (
            selectedLabels.map((item) => (
              <span key={item.value} className="multi-select-tag">
                {item.label}
                <span
                  className="multi-select-tag-remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTag(item.value);
                  }}
                >
                  ×
                </span>
              </span>
            ))
          )}
        </div>

        {isOpen && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              background: "white",
              border: "1px solid var(--border)",
              borderRadius: "6px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              zIndex: 100,
              maxHeight: "200px",
              overflowY: "auto",
            }}
          >
            {options.map((opt) => (
              <div
                key={opt.value}
                onClick={() => toggleOption(opt.value)}
                style={{
                  padding: "10px 14px",
                  cursor: "pointer",
                  background: value.includes(opt.value) ? "#eff6ff" : "white",
                  borderBottom: "1px solid #f3f4f6",
                }}
              >
                <input
                  type="checkbox"
                  checked={value.includes(opt.value)}
                  readOnly
                  style={{ marginRight: "10px" }}
                />
                {opt.label}
              </div>
            ))}
          </div>
        )}
      </div>

      {maxSelections && (
        <div className="form-hint">
          เลือกได้สูงสุด {maxSelections} รายการ ({value.length}/{maxSelections})
        </div>
      )}
    </div>
  );
}
