import type { ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
};

export function PillButton({ children, variant = "primary", className = "", ...props }: ButtonProps) {
  return (
    <button className={`pill-button ${variant === "secondary" ? "secondary" : ""} ${className}`} {...props}>
      {children}
    </button>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export function PillInput({ label, className = "", ...props }: InputProps) {
  return (
    <label className={`pill-field ${className}`}>
      <span>{label}</span>
      <input {...props} />
    </label>
  );
}

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  options: string[];
  placeholder?: string;
};

export function PillSelect({ label, options, placeholder = "Select", className = "", ...props }: SelectProps) {
  return (
    <label className={`pill-field ${className}`}>
      <span>{label}</span>
      <select {...props}>
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
