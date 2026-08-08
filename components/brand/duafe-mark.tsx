"use client";

type DuafeMarkProps = {
  className?: string;
  title?: string;
  /** URL admin (png/svg) — sinon symbole SVG intégré */
  src?: string | null;
};

/** Symbole Duafe (peigne Akan) — marque Awura. */
export function DuafeMark({ className = "size-8", title, src }: DuafeMarkProps) {
  if (src?.trim()) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src.trim()}
        alt={title ?? ""}
        className={`object-contain ${className}`}
      />
    );
  }

  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {title ? <title>{title}</title> : null}
      {/* Manche */}
      <path
        fill="currentColor"
        d="M28 4h8c2.2 0 4 1.8 4 4v10H24V8c0-2.2 1.8-4 4-4z"
      />
      {/* Corps du peigne */}
      <path
        fill="currentColor"
        d="M18 18h28c2.2 0 4 1.8 4 4v6H14v-6c0-2.2 1.8-4 4-4z"
      />
      {/* Dents */}
      <rect x="16" y="28" width="4" height="30" rx="1.5" fill="currentColor" />
      <rect x="24" y="28" width="4" height="32" rx="1.5" fill="currentColor" />
      <rect x="32" y="28" width="4" height="30" rx="1.5" fill="currentColor" />
      <rect x="40" y="28" width="4" height="32" rx="1.5" fill="currentColor" />
      <rect x="48" y="28" width="4" height="28" rx="1.5" fill="currentColor" />
    </svg>
  );
}
