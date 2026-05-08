import type { InputHTMLAttributes } from "react";

type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  containerClassName?: string;
  error?: string;
  hint?: string;
  label: string;
};

export function TextInput({
  className = "",
  containerClassName = "",
  error,
  hint,
  id,
  label,
  name,
  ...props
}: TextInputProps) {
  const inputId = id ?? name;
  const hintId = hint && inputId ? `${inputId}-hint` : undefined;
  const errorId = error && inputId ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div
      className={["space-y-2", containerClassName].filter(Boolean).join(" ")}
      suppressHydrationWarning
    >
      <label className="block text-sm font-medium text-ink" htmlFor={inputId}>
        {label}
      </label>
      <input
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
        data-lpignore="true"
        suppressHydrationWarning
        className={[
          "w-full rounded-md border bg-white px-3 py-2.5 text-sm text-ink shadow-sm transition",
          "placeholder:text-ink/35 focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/20",
          "disabled:cursor-not-allowed disabled:bg-surface disabled:text-ink/50",
          error ? "border-berry" : "border-ink/15",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        id={inputId}
        name={name}
        {...props}
      />
      {hint ? (
        <p className="text-xs text-ink/55" id={hintId}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className="text-xs font-medium text-berry" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
