"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/features/auth/context/auth-provider";
import { usePushSubscription } from "@/features/notifications/hooks/use-push-subscription";
import { useLiveRefresh } from "@/lib/hooks/use-live-refresh";
import type { InboxNotification } from "@/lib/infrastructure/supabase/notifications-inbox";
import { toIntlLocale } from "@/lib/i18n/intl-locale";

const iconClass =
  "relative inline-flex size-11 items-center justify-center rounded-xl text-foreground transition hover:bg-background-alt focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

const REFRESH_EVENT = "awura:notifications-refresh";

type PushNotificationButtonProps = {
  /** @deprecated Conservé pour compat — l’inbox remplace la redirection. */
  hrefWhenEnabled?: string;
  variant?: "site" | "admin";
};

function toPath(link: string): string {
  try {
    const url = new URL(link, window.location.origin);
    if (url.origin === window.location.origin) {
      return `${url.pathname}${url.search}${url.hash}`;
    }
  } catch {
    /* ignore */
  }
  return link.startsWith("/") ? link : "/";
}

export function PushNotificationButton({
  variant = "site",
}: PushNotificationButtonProps) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { session, user } = useAuth();
  const { permission, enabled, busy, enable, configured } =
    usePushSubscription();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<InboxNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const load = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!session?.access_token) {
        setItems([]);
        setUnread(0);
        return;
      }
      if (!opts?.silent) setLoading(true);
      try {
        const res = await fetch("/api/notifications", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok) return;
        const json = (await res.json()) as {
          notifications?: InboxNotification[];
          unread?: number;
        };
        setItems(json.notifications ?? []);
        setUnread(json.unread ?? 0);
      } finally {
        setLoading(false);
      }
    },
    [session?.access_token],
  );

  useEffect(() => {
    void load();
  }, [load]);

  useLiveRefresh(() => load({ silent: true }), {
    enabled: Boolean(session?.access_token),
    intervalMs: 25_000,
  });

  useEffect(() => {
    const onRefresh = () => void load({ silent: true });
    window.addEventListener(REFRESH_EVENT, onRefresh);
    return () => window.removeEventListener(REFRESH_EVENT, onRefresh);
  }, [load]);

  useEffect(() => {
    if (!open) return;
    void load();
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, load]);

  if (!configured || permission === "unsupported") return null;

  const onBellClick = async () => {
    if (permission === "denied") {
      setOpen((value) => !value);
      return;
    }
    if (!enabled) {
      const result = await enable();
      if (!result.ok) {
        setOpen(true);
        return;
      }
    }
    setOpen((value) => !value);
  };

  const markRead = async (id: string) => {
    if (!session?.access_token) return;
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });
    await load();
  };

  const markAll = async () => {
    if (!session?.access_token) return;
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ all: true }),
    });
    await load();
  };

  const removeOne = async (id: string) => {
    if (!session?.access_token) return;
    await fetch(`/api/notifications?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    await load();
  };

  const removeAll = async () => {
    if (!session?.access_token) return;
    await fetch("/api/notifications?all=1", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    await load();
  };

  const openItem = async (item: InboxNotification) => {
    if (!item.readAt) await markRead(item.id);
    setOpen(false);
    if (item.link) router.push(toPath(item.link));
  };

  const showDeniedHelp = open && permission === "denied";
  const showInbox = open && permission !== "denied";

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className={iconClass}
        aria-label={t("support.push.inboxTitle")}
        title={t("support.push.inboxTitle")}
        aria-expanded={open}
        disabled={busy}
        onClick={() => void onBellClick()}
      >
        <svg
          viewBox="0 0 24 24"
          className="size-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          aria-hidden
        >
          <path d="M12 3a5 5 0 0 0-5 5v2.2c0 .7-.2 1.4-.6 2L5 14.5h14L17.6 12.2c-.4-.6-.6-1.3-.6-2V8a5 5 0 0 0-5-5Z" />
          <path d="M10 18a2 2 0 0 0 4 0" />
        </svg>
        {unread > 0 ? (
          <span
            className={`absolute right-1 top-1 flex min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-medium leading-4 text-background ${
              variant === "admin" ? "bg-primary" : "bg-accent"
            }`}
          >
            {unread > 9 ? "9+" : unread}
          </span>
        ) : enabled ? (
          <span
            className={`absolute right-1.5 top-1.5 size-2 rounded-full ${
              variant === "admin" ? "bg-primary" : "bg-accent"
            }`}
            aria-hidden
          />
        ) : null}
      </button>

      {showDeniedHelp ? (
        <div className="absolute right-0 z-50 mt-2 w-72 rounded-2xl border border-border bg-background p-3 text-sm shadow-lg sm:w-80">
          <p className="font-medium text-primary">
            {t("support.push.blockedTitle")}
          </p>
          <p className="mt-1 text-muted">{t("support.push.blockedBody")}</p>
        </div>
      ) : null}

      {showInbox ? (
        <div
          className="fixed inset-x-3 top-[4.5rem] z-50 mx-auto flex max-h-[min(28rem,70vh)] w-auto max-w-md flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-lg sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-[22rem]"
          role="dialog"
          aria-label={t("support.push.inboxTitle")}
        >
          <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2.5">
            <p className="font-serif text-lg text-primary">
              {t("support.push.inboxTitle")}
            </p>
            <div className="flex flex-wrap justify-end gap-1">
              {unread > 0 ? (
                <button
                  type="button"
                  className="rounded-lg px-2 py-1 text-xs text-accent hover:bg-background-alt"
                  onClick={() => void markAll()}
                >
                  {t("support.push.markAllRead")}
                </button>
              ) : null}
              {items.length > 0 ? (
                <button
                  type="button"
                  className="rounded-lg px-2 py-1 text-xs text-muted hover:bg-background-alt hover:text-primary"
                  onClick={() => void removeAll()}
                >
                  {t("support.push.clearAll")}
                </button>
              ) : null}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {!user ? (
              <p className="px-4 py-6 text-center text-sm text-muted">
                {t("support.push.loginForInbox")}
              </p>
            ) : loading && items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted">
                {t("support.push.loading")}
              </p>
            ) : items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted">
                {t("support.push.empty")}
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {items.map((item) => (
                  <li key={item.id} className="relative">
                    <button
                      type="button"
                      className={`w-full px-3 py-3 text-left transition hover:bg-background-alt/70 ${
                        item.readAt ? "" : "bg-accent/5"
                      }`}
                      onClick={() => void openItem(item)}
                    >
                      <div className="flex items-start gap-2 pr-8">
                        {!item.readAt ? (
                          <span
                            className="mt-1.5 size-2 shrink-0 rounded-full bg-accent"
                            aria-hidden
                          />
                        ) : (
                          <span className="mt-1.5 size-2 shrink-0" aria-hidden />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-primary">
                            {item.title}
                          </p>
                          {item.body ? (
                            <p className="mt-0.5 line-clamp-2 text-xs text-muted">
                              {item.body}
                            </p>
                          ) : null}
                          <p className="mt-1 text-[11px] text-muted">
                            {new Intl.DateTimeFormat(
                              toIntlLocale(i18n.language),
                              {
                                dateStyle: "short",
                                timeStyle: "short",
                              },
                            ).format(new Date(item.createdAt))}
                          </p>
                        </div>
                      </div>
                    </button>
                    <button
                      type="button"
                      className="absolute right-2 top-2 rounded-lg p-1.5 text-muted hover:bg-background-alt hover:text-primary"
                      aria-label={t("support.push.delete")}
                      onClick={(event) => {
                        event.stopPropagation();
                        void removeOne(item.id);
                      }}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="size-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.75"
                      >
                        <path d="M6 7h12M10 7V5h4v2m-6 3v8m4-8v8M8 7l1 12h6l1-12" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {!enabled && permission === "default" ? (
            <div className="border-t border-border px-3 py-2">
              <button
                type="button"
                className="w-full rounded-xl bg-primary px-3 py-2 text-sm text-background"
                disabled={busy}
                onClick={() => void enable()}
              >
                {busy ? t("support.push.enabling") : t("support.push.enable")}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function dispatchNotificationsRefresh() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(REFRESH_EVENT));
  }
}
