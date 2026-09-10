"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/context/auth-provider";
import { useActionLock } from "@/lib/hooks/use-action-lock";

const fieldClass =
  "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted/70 focus:border-accent";

/** En-tête de la page « Renoncer au contrat ici ». */
export function WithdrawalPageIntro() {
  const { t } = useTranslation();
  return (
    <header className="space-y-4">
      <p className="text-sm uppercase tracking-[0.18em] text-accent">
        {t("legal.withdrawalForm.eyebrow")}
      </p>
      <h1 className="font-serif text-4xl text-primary sm:text-5xl">
        {t("legal.withdrawHere")}
      </h1>
      <p className="max-w-xl text-muted">{t("legal.withdrawalForm.intro")}</p>
    </header>
  );
}

/**
 * Formulaire de rétractation en ligne (art. D221-5) : identité, identification
 * du contrat, e-mail d'accusé, puis bouton « Confirmer la rétractation ».
 */
export function WithdrawalForm() {
  const { t, i18n } = useTranslation();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { locked, run } = useActionLock();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [orderRef, setOrderRef] = useState("");
  const [orderDate, setOrderDate] = useState("");
  const [contractDetails, setContractDetails] = useState("");
  const [ackEmail, setAckEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);

  useEffect(() => {
    const fromQuery = searchParams.get("commande")?.trim();
    if (fromQuery) setOrderRef((prev) => prev || fromQuery);
  }, [searchParams]);

  useEffect(() => {
    if (user?.email) setAckEmail((prev) => prev || user.email || "");
    const meta = user?.user_metadata;
    if (meta && typeof meta === "object") {
      const given = String(meta.given_name ?? meta.first_name ?? "").trim();
      const family = String(meta.family_name ?? meta.last_name ?? "").trim();
      const full = String(meta.full_name ?? meta.name ?? "").trim();
      if (given) setFirstName((prev) => prev || given);
      if (family) setLastName((prev) => prev || family);
      if (!given && full) {
        const [first, ...rest] = full.split(/\s+/);
        setFirstName((prev) => prev || first);
        if (rest.length) setLastName((prev) => prev || rest.join(" "));
      }
    }
  }, [user]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    void run(async () => {
      const response = await fetch("/api/retractation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          orderRef,
          orderDate,
          contractDetails,
          ackEmail,
          company: honeypot,
        }),
      });
      const json = (await response.json()) as {
        ok?: boolean;
        submittedAt?: string;
        error?: string;
      };
      if (!response.ok || !json.ok) {
        setError(
          json.error === "ack_failed"
            ? t("legal.withdrawalForm.ackFailed")
            : t("legal.withdrawalForm.error"),
        );
        return;
      }
      setSubmittedAt(json.submittedAt ?? new Date().toISOString());
    });
  };

  if (submittedAt) {
    const when = new Intl.DateTimeFormat(i18n.language, {
      dateStyle: "full",
      timeStyle: "short",
    }).format(new Date(submittedAt));
    return (
      <div
        className="space-y-3 rounded-3xl bg-background-alt px-6 py-8"
        role="status"
      >
        <h2 className="font-serif text-2xl text-primary">
          {t("legal.withdrawalForm.successTitle")}
        </h2>
        <p className="text-sm leading-relaxed text-muted">
          {t("legal.withdrawalForm.successBody", { date: when, email: ackEmail })}
        </p>
      </div>
    );
  }

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5 text-sm">
          <span className="text-muted">{t("legal.withdrawalForm.firstName")}</span>
          <input
            required
            autoComplete="given-name"
            className={fieldClass}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </label>
        <label className="space-y-1.5 text-sm">
          <span className="text-muted">{t("legal.withdrawalForm.lastName")}</span>
          <input
            required
            autoComplete="family-name"
            className={fieldClass}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5 text-sm">
          <span className="text-muted">{t("legal.withdrawalForm.orderRef")}</span>
          <input
            required
            className={fieldClass}
            value={orderRef}
            onChange={(e) => setOrderRef(e.target.value)}
            placeholder={t("legal.withdrawalForm.orderRefPlaceholder")}
          />
        </label>
        <label className="space-y-1.5 text-sm">
          <span className="text-muted">
            {t("legal.withdrawalForm.orderDate")}{" "}
            <span className="text-muted/60">({t("legal.withdrawalForm.optional")})</span>
          </span>
          <input
            className={fieldClass}
            value={orderDate}
            onChange={(e) => setOrderDate(e.target.value)}
            placeholder={t("legal.withdrawalForm.orderDatePlaceholder")}
          />
        </label>
      </div>
      <label className="block space-y-1.5 text-sm">
        <span className="text-muted">{t("legal.withdrawalForm.contractDetails")}</span>
        <textarea
          required
          rows={5}
          className={fieldClass}
          value={contractDetails}
          onChange={(e) => setContractDetails(e.target.value)}
          placeholder={t("legal.withdrawalForm.contractDetailsPlaceholder")}
        />
      </label>
      <label className="block space-y-1.5 text-sm">
        <span className="text-muted">{t("legal.withdrawalForm.ackEmail")}</span>
        <input
          required
          type="email"
          autoComplete="email"
          className={fieldClass}
          value={ackEmail}
          onChange={(e) => setAckEmail(e.target.value)}
        />
        <span className="block text-xs text-muted">
          {t("legal.withdrawalForm.ackEmailHint")}
        </span>
      </label>
      <div className="hidden" aria-hidden>
        <label>
          Company
          <input
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
          />
        </label>
      </div>
      <p className="text-xs leading-relaxed text-muted">
        {t("legal.withdrawalForm.legalNote")}
      </p>
      {error ? (
        <p className="text-sm text-accent" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" size="lg" pending={locked}>
        {t("legal.withdrawalForm.confirm")}
      </Button>
    </form>
  );
}
