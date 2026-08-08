"use client";

type DuafePatternProps = {
  enabled?: boolean;
  className?: string;
};

/** Motif Duafe en filigrane (charte — faible opacité). */
export function DuafePattern({
  enabled = true,
  className = "",
}: DuafePatternProps) {
  if (!enabled) return null;

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden opacity-[0.06] dark:opacity-[0.08] ${className}`}
    >
      <svg className="h-full w-full text-primary" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern
            id="awura-duafe-pattern"
            width="72"
            height="72"
            patternUnits="userSpaceOnUse"
          >
            <g transform="translate(20 12) scale(0.5)">
              <path
                fill="currentColor"
                d="M28 4h8c2.2 0 4 1.8 4 4v10H24V8c0-2.2 1.8-4 4-4zM18 18h28c2.2 0 4 1.8 4 4v6H14v-6c0-2.2 1.8-4 4-4z"
              />
              <rect x="16" y="28" width="4" height="28" rx="1.5" fill="currentColor" />
              <rect x="24" y="28" width="4" height="30" rx="1.5" fill="currentColor" />
              <rect x="32" y="28" width="4" height="28" rx="1.5" fill="currentColor" />
              <rect x="40" y="28" width="4" height="30" rx="1.5" fill="currentColor" />
              <rect x="48" y="28" width="4" height="26" rx="1.5" fill="currentColor" />
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#awura-duafe-pattern)" />
      </svg>
    </div>
  );
}
