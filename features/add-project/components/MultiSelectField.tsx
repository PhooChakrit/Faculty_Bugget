"use client";

import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

interface MultiSelectFieldProps {
  label: string;
  options: { value: string; label: string }[];
  value: string[];
  onChange: (values: string[]) => void;
  maxSelections?: number;
  hint?: string;
}

export function MultiSelectField({
  label,
  options,
  value,
  onChange,
  maxSelections,
  hint,
}: MultiSelectFieldProps) {
  const toggleOption = (optValue: string) => {
    if (value.includes(optValue)) {
      onChange(value.filter((v) => v !== optValue));
    } else {
      if (maxSelections && value.length >= maxSelections) return;
      onChange([...value, optValue]);
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
      <div className="flex flex-wrap gap-2 p-3 border rounded-md min-h-[42px] bg-background">
        {value.length === 0 ? (
          <span className="text-muted-foreground">เลือก{label}...</span>
        ) : (
          value.map((v) => {
            const opt = options.find((o) => o.value === v);
            return (
              <Badge key={v} variant="secondary" className="gap-1">
                {opt?.label}
                <button
                  type="button"
                  onClick={() => onChange(value.filter((x) => x !== v))}
                  className="ml-1 hover:text-destructive"
                >
                  ×
                </button>
              </Badge>
            );
          })
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 mt-2">
        {options.map((opt) => (
          <div key={opt.value} className="flex items-center space-x-2">
            <Checkbox
              id={`multi-${opt.value}`}
              checked={value.includes(opt.value)}
              disabled={
                !value.includes(opt.value) &&
                maxSelections !== undefined &&
                value.length >= maxSelections
              }
              onCheckedChange={() => toggleOption(opt.value)}
            />
            <label
              htmlFor={`multi-${opt.value}`}
              className="text-sm cursor-pointer"
            >
              {opt.label}
            </label>
          </div>
        ))}
      </div>
      {maxSelections && (
        <p className="text-xs text-muted-foreground">
          เลือกได้สูงสุด {maxSelections} รายการ ({value.length}/{maxSelections})
        </p>
      )}
    </div>
  );
}
