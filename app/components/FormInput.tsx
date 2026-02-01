interface FormInputProps {
  label: string;
  name: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  success?: boolean;
  type?: string;
  maxLength?: number;
}

export default function FormInput({
  label,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  hint,
  error,
  success,
  type = "text",
  maxLength,
}: FormInputProps) {
  const inputClass = `form-input ${error ? "error" : ""} ${success ? "success" : ""}`;

  return (
    <div className="form-group">
      <label className="form-label" htmlFor={name}>
        {label}
        {required && <span className="required">*</span>}
      </label>
      {hint && <div className="form-hint">{hint}</div>}
      <div className="input-wrapper">
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={inputClass}
          maxLength={maxLength}
        />
        {success && <span className="input-icon success">✓</span>}
        {error && <span className="input-icon error">ⓘ</span>}
      </div>
      {error && <div className="form-error">{error}</div>}
    </div>
  );
}
