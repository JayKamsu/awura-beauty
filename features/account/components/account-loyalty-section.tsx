"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/context/auth-provider";
import type { LoyaltyLedgerEntry } from "@/lib/infrastructure/supabase/loyalty";
import { toIntlLocale } from "@/lib/i18n/intl-locale";

const REF_STORAGE_KEY = "awura_referral_code";

export function AccountLoyaltySection() {
  const { t, i18n } = useTranslation();
  const { session } = useAuth();
  const [balance, setBalance] = useState(0);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referralLink, setReferralLink] = useState<string | null>(null);
  const [ledger, setLedger] = useState<LoyaltyLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [attachError, setAttachError] = useState<string | null>(null);

  const load = async () => {
    if (!session?.access_token) return;
    setLoading(true);
    const response = await fetch("/api/account/loyalty", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    const json = (await response.json()) as {
      balance?: number;
      referralCode?: string | null;
      referralLink?: string | null;
      ledger?: LoyaltyLedgerEntry[];
    };
    if (response.ok) {
      setBalance(json.balance ?? 0);
      setReferralCode(json.referralCode ?? null);
      setReferralLink(json.referralLink ?? null);
      setLedger(json.ledger ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    void load();
    // token only — load se recreate à chaque render
    // eslint-disable-next-line react-hooks/exhaustive-deps -- session token gate
  }, [session?.access_token]);

  useEffect(() => {
    if (!session?.access_token) return;
    const pending =
      typeof window !== "undefined"
        ? window.localStorage.getItem(REF_STORAGE_KEY)
        : null;
    if (!pending) return;

    void (async () => {
      const response = await fetch("/api/account/loyalty/referral", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: pending }),
      });
      window.localStorage.removeItem(REF_STORAGE_KEY);
      if (!response.ok) {
        const json = (await response.json()) as { error?: string };
        if (json.error && json.error !== "already_referred") {
          setAttachError(t(`account.loyalty.errors.${json.error}`, {
            defaultValue: t("account.loyalty.errors.generic"),
          }));
        }
      }
      await load();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot attach on token
  }, [session?.access_token]);

  const copyLink = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section id="fidelite" className="space-y-5">
      <h2 className="font-serif text-3xl text-primary">
        {t("account.loyalty.title")}
      </h2>

      {loading ? (
        <p className="text-muted">{t("account.loyalty.loading")}</p>
      ) : (
        <>
          <div className="rounded-2xl border border-border p-5">
            <p className="text-sm text-muted">{t("account.loyalty.balanceLabel")}</p>
            <p className="font-serif text-4xl text-primary">
              {t("account.loyalty.balanceValue", { count: balance })}
            </p>
            <p className="mt-2 text-sm text-muted">
              {t("account.loyalty.rules")}
            </p>
          </div>

          <div className="space-y-3 rounded-2xl border border-border p-5">
            <h3 className="font-medium text-primary">
              {t("account.loyalty.referralTitle")}
            </h3>
            <p className="text-sm text-muted">
              {t("account.loyalty.referralBody")}
            </p>
            {referralCode ? (
              <p className="text-sm">
                <span className="text-muted">
                  {t("account.loyalty.yourCode")}{" "}
                </span>
                <span className="font-medium text-primary">{referralCode}</span>
              </p>
            ) : null}
            {referralLink ? (
              <div className="flex flex-wrap gap-2">
                <code className="max-w-full truncate rounded-xl bg-background-alt px-3 py-2 text-xs text-muted">
                  {referralLink}
                </code>
                <Button type="button" variant="primary-outline" size="md" onClick={() => void copyLink()}>
                  {copied
                    ? t("account.loyalty.copied")
                    : t("account.loyalty.copyLink")}
                </Button>
              </div>
            ) : null}
            {attachError ? (
              <p className="text-sm text-accent" role="alert">
                {attachError}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <h3 className="font-medium text-primary">
              {t("account.loyalty.historyTitle")}
            </h3>
            {ledger.length === 0 ? (
              <p className="text-sm text-muted">
                {t("account.loyalty.historyEmpty")}
              </p>
            ) : (
              <ul className="divide-y divide-border rounded-2xl border border-border">
                {ledger.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
                  >
                    <span className="text-muted">
                      {t(`account.loyalty.reasons.${entry.reason}`)}
                    </span>
                    <span
                      className={
                        entry.delta >= 0 ? "text-primary" : "text-accent"
                      }
                    >
                      {entry.delta >= 0 ? "+" : ""}
                      {entry.delta}
                    </span>
                    <span className="w-full text-xs text-muted sm:w-auto">
                      {new Intl.DateTimeFormat(toIntlLocale(i18n.language), {
                        dateStyle: "short",
                        timeStyle: "short",
                      }).format(new Date(entry.created_at))}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </section>
  );
}

export { REF_STORAGE_KEY };
