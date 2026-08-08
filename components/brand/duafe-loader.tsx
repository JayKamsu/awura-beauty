"use client";

import { DuafeMark } from "@/components/brand/duafe-mark";
import { useBrandSettings } from "@/components/brand/brand-settings-provider";

type DuafeLoaderProps = {
  label?: string;
  className?: string;
};

export function DuafeLoader({ label, className = "" }: DuafeLoaderProps) {
  const { settings } = useBrandSettings();

  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 text-primary ${className}`}
      role="status"
      aria-live="polite"
    >
      <DuafeMark
        src={settings.duafeUrl || null}
        className="size-12 animate-pulse text-accent"
      />
      {label ? <p className="text-sm text-muted">{label}</p> : null}
    </div>
  );
}
