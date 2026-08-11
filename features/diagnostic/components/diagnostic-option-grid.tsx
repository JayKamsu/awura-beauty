"use client";

import type { DiagnosticOption } from "@/lib/domain/diagnostic";

/**
 * Grille de réponses à une question de diagnostic : image illustrative optionnelle,
 * label, indice explicatif. Utilisée par le flux en ligne et le flux présentiel.
 */
export function DiagnosticOptionGrid({
  options,
  selected,
  onSelect,
}: {
  options: DiagnosticOption[];
  selected: string | undefined;
  onSelect: (valueKey: string) => void;
}) {
  const hasImages = options.some((o) => o.imageUrl);

  return (
    <div
      className={`grid gap-3 ${hasImages ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}
    >
      {options.map((option) => {
        const isActive = selected === option.valueKey;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onSelect(option.valueKey)}
            className={`overflow-hidden rounded-2xl border text-left transition ${
              isActive
                ? "border-primary bg-primary text-background"
                : "border-border bg-background hover:border-accent"
            }`}
          >
            {option.imageUrl ? (
              <div className="aspect-[4/3] w-full overflow-hidden bg-background-alt">
                <img
                  src={option.imageUrl}
                  alt={option.label}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            ) : null}
            <div className="px-5 py-4">
              <span className="block font-medium">{option.label}</span>
              {option.hint ? (
                <span
                  className={`mt-1 block text-sm ${
                    isActive ? "text-background/80" : "text-muted"
                  }`}
                >
                  {option.hint}
                </span>
              ) : null}
            </div>
          </button>
        );
      })}
    </div>
  );
}
