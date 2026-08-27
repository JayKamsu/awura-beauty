type StarsProps = {
  count?: number;
  /** Nombre d'étoiles remplies (défaut = toutes). */
  value?: number;
  className?: string;
};

/** Affiche une rangée d'étoiles (notation visuelle). */
export function Stars({
  count = 5,
  value,
  className = "text-accent",
}: StarsProps) {
  const filled = value ?? count;
  return (
    <div
      className={`flex items-center gap-0.5 ${className}`}
      role="img"
      aria-label={`${filled} / ${count}`}
    >
      {Array.from({ length: count }).map((_, index) => (
        <svg
          key={index}
          viewBox="0 0 20 20"
          className={`size-3.5 fill-current ${index < filled ? "" : "opacity-25"}`}
        >
          <path d="M10 1.5 12.4 7l6 .5-4.6 4 1.4 5.8L10 14.8 4.8 17.3l1.4-5.8L1.6 7.5l6-.5L10 1.5Z" />
        </svg>
      ))}
    </div>
  );
}
