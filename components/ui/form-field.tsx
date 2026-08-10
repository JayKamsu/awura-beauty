import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

const controlClass =
  "w-full min-h-11 rounded-xl border border-border bg-background px-3.5 py-2.5 text-base text-foreground outline-none transition placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/20 sm:text-sm";

type TextFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "id" | "className"
> & {
  id: string;
  label: string;
  error?: string | null;
  hint?: string | null;
  className?: string;
};

/** Champ texte accessible : label visible + erreur liée (WCAG 1.3.1 / 3.3.1). */
export function TextField({
  id,
  label,
  error,
  hint,
  className,
  ...inputProps
}: TextFieldProps) {
  const hintId = hint && !error ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-foreground">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`${controlClass} ${error ? "border-accent" : ""} ${className ?? ""}`}
        {...inputProps}
      />
      {hint && !error ? (
        <p id={hintId} className="text-xs text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-sm text-accent" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

type SelectFieldProps = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "id" | "className"
> & {
  id: string;
  label: string;
  error?: string | null;
  className?: string;
  children: ReactNode;
};

/** Liste déroulante accessible : label visible + erreur liée (WCAG 1.3.1 / 3.3.1). */
export function SelectField({
  id,
  label,
  error,
  className,
  children,
  ...selectProps
}: SelectFieldProps) {
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-foreground">
        {label}
      </label>
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        className={`${controlClass} ${error ? "border-accent" : ""} ${className ?? ""}`}
        {...selectProps}
      >
        {children}
      </select>
      {error ? (
        <p id={errorId} className="text-sm text-accent" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export { controlClass as formControlClass };
