"use client";

import { useRef, useState } from "react";

/**
 * Verrou synchrone anti double-clic / double soumission.
 * useRef bloque immédiatement (avant le re-render de disabled).
 */
export function useActionLock() {
  const lockedRef = useRef(false);
  const [locked, setLocked] = useState(false);

  async function run<T>(action: () => Promise<T>): Promise<T | undefined> {
    if (lockedRef.current) return undefined;
    lockedRef.current = true;
    setLocked(true);
    try {
      return await action();
    } finally {
      lockedRef.current = false;
      setLocked(false);
    }
  }

  function runSync(action: () => void) {
    if (lockedRef.current) return;
    lockedRef.current = true;
    setLocked(true);
    try {
      action();
    } finally {
      window.setTimeout(() => {
        lockedRef.current = false;
        setLocked(false);
      }, 1500);
    }
  }

  return { locked, run, runSync };
}
