"use client";

type RatingInputProps = {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
};

/** Sélecteur de note par étoiles cliquables, de 1 à 5. */
export function RatingInput({ value, onChange, disabled }: RatingInputProps) {
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Note">
      {Array.from({ length: 5 }).map((_, index) => {
        const starValue = index + 1;
        const filled = starValue <= value;
        return (
          <button
            key={starValue}
            type="button"
            role="radio"
            aria-checked={filled}
            aria-label={`${starValue} / 5`}
            disabled={disabled}
            onClick={() => onChange(starValue)}
            className="p-0.5 text-accent transition disabled:pointer-events-none disabled:opacity-60"
          >
            <svg
              viewBox="0 0 20 20"
              className={`size-6 ${filled ? "fill-current" : "fill-none stroke-current stroke-1"}`}
            >
              <path d="M10 1.5 12.4 7l6 .5-4.6 4 1.4 5.8L10 14.8 4.8 17.3l1.4-5.8L1.6 7.5l6-.5L10 1.5Z" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
