"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { registerMessagingServiceWorker } from "@/lib/connectors/firebase-client";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type PwaInstallState = {
  deferred: BeforeInstallPromptEvent | null;
  installed: boolean;
  ready: boolean;
};

let state: PwaInstallState = {
  deferred: null,
  installed: false,
  ready: false,
};

const listeners = new Set<() => void>();
let bootstrapped = false;

function emit() {
  for (const listener of listeners) listener();
}

function setState(patch: Partial<PwaInstallState>) {
  state = { ...state, ...patch };
  emit();
}

function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return true;
  const mq = window.matchMedia("(display-mode: standalone)").matches;
  const iosStandalone =
    "standalone" in navigator &&
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  return mq || iosStandalone;
}

function isIosDevice(): boolean {
  if (typeof window === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function bootstrapPwaInstall() {
  if (bootstrapped || typeof window === "undefined") return;
  bootstrapped = true;

  void registerMessagingServiceWorker();

  if (isStandaloneDisplay()) {
    setState({ installed: true, ready: true, deferred: null });
    return;
  }

  setState({ ready: true });

  const onBeforeInstall = (event: Event) => {
    event.preventDefault();
    setState({ deferred: event as BeforeInstallPromptEvent });
  };

  const onInstalled = () => {
    setState({ installed: true, deferred: null });
  };

  window.addEventListener("beforeinstallprompt", onBeforeInstall);
  window.addEventListener("appinstalled", onInstalled);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

function getServerSnapshot(): PwaInstallState {
  return { deferred: null, installed: false, ready: false };
}

/**
 * Installation PWA (Chrome/Edge/Android via beforeinstallprompt ;
 * iOS via instructions « Sur l’écran d’accueil »).
 */
export function usePwaInstall() {
  const snapshot = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  useEffect(() => {
    bootstrapPwaInstall();
  }, []);

  const iosHint = isIosDevice() && !snapshot.installed;
  const canPrompt = Boolean(snapshot.deferred) && !snapshot.installed;

  const install = useCallback(async (): Promise<boolean> => {
    const deferred = state.deferred;
    if (!deferred) return false;
    try {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      setState({ deferred: null });
      if (choice.outcome === "accepted") {
        setState({ installed: true });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  return {
    installed: snapshot.installed,
    canPrompt,
    iosHint,
    ready: snapshot.ready,
    available: snapshot.ready && !snapshot.installed && (canPrompt || iosHint),
    install,
  };
}
