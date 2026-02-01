interface FormTextareaProps {
  label: string;
  name: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  rows?: number;
  maxLength?: number;
}

export default function FormTextarea({
  label,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  hint,
  error,
  rows = 4,
  maxLength,
}: FormTextareaProps) {
  const textareaClass = `form-textarea ${error ? "error" : ""}`;

  return (
    <div className="form-group">
      <label className="form-label" htmlFor={name}>
        {label}
        {required && <span className="required">*</span>}
      </label>
      {hint && <div className="form-hint">{hint}</div>}
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={textareaClass}
        rows={rows}
        maxLength={maxLength}
      />
      {maxLength && (
        <div className="form-hint" style={{ textAlign: "right" }}>
          {value?.length || 0}/{maxLength} ตัวอักษร
        </div>
      )}
      {error && <div className="form-error">{error}</div>}
    </div>
  );
}
