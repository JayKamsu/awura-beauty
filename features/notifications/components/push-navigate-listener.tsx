"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Redirection quand le SW ne peut pas `navigate()` (navigateurs sans API). */
export function PushNavigateListener() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const onMessage = (event: MessageEvent) => {
      if (event.data?.type !== "NOTIFICATION_NAVIGATE" || !event.data.url) {
        return;
      }
      try {
        const url = new URL(String(event.data.url), window.location.origin);
        if (url.origin === window.location.origin) {
          router.push(`${url.pathname}${url.search}${url.hash}`);
        } else {
          window.location.href = url.href;
        }
      } catch {
        router.push("/");
      }
    };

    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => {
      navigator.serviceWorker.removeEventListener("message", onMessage);
    };
  }, [router]);

  return null;
}
