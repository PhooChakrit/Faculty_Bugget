interface FormSelectProps {
  label: string;
  name: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  hint?: string;
  error?: string;
}

export default function FormSelect({
  label,
  name,
  value,
  onChange,
  options,
  placeholder,
  required = false,
  hint,
  error,
}: FormSelectProps) {
  const selectClass = `form-select ${error ? "error" : ""}`;

  return (
    <div className="form-group">
      <label className="form-label" htmlFor={name}>
        {label}
        {required && <span className="required">*</span>}
      </label>
      {hint && <div className="form-hint">{hint}</div>}
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        className={selectClass}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <div className="form-error">{error}</div>}
    </div>
  );
}
