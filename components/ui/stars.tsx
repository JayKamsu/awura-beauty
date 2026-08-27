type StarsProps = {
  count?: number;
  /** Nombre d'étoiles remplies (défaut = toutes), accepte les décimales. */
  value?: number;
  className?: string;
};

/** Affiche une rangée d'étoiles (notation visuelle, y compris notes fractionnaires). */
export function Stars({
  count = 5,
  value,
  className = "text-accent",
}: StarsProps) {
  const filled = value ?? count;
  const label =
    Number.isInteger(filled) || value === undefined
      ? `${filled} / ${count}`
      : `${filled.toFixed(1)} / ${count}`;
  return (
    <div
      className={`flex items-center gap-0.5 ${className}`}
      role="img"
      aria-label={label}
    >
      {Array.from({ length: count }).map((_, index) => {
        const portion = Math.min(1, Math.max(0, filled - index));
        return (
          <span key={index} className="relative inline-flex size-3.5 shrink-0">
            <svg
              viewBox="0 0 20 20"
              className="absolute inset-0 size-3.5 fill-current opacity-25"
              aria-hidden
            >
              <path d="M10 1.5 12.4 7l6 .5-4.6 4 1.4 5.8L10 14.8 4.8 17.3l1.4-5.8L1.6 7.5l6-.5L10 1.5Z" />
            </svg>
            {portion > 0 ? (
              <span
                className="absolute inset-y-0 left-0 overflow-hidden"
                style={{ width: `${portion * 100}%` }}
              >
                <svg
                  viewBox="0 0 20 20"
                  className="size-3.5 fill-current"
                  aria-hidden
                >
                  <path d="M10 1.5 12.4 7l6 .5-4.6 4 1.4 5.8L10 14.8 4.8 17.3l1.4-5.8L1.6 7.5l6-.5L10 1.5Z" />
                </svg>
              </span>
            ) : null}
          </span>
        );
      })}
    </div>
  );
}
