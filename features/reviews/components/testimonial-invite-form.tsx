"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { RatingInput } from "@/components/ui/rating-input";

/** Formulaire public pour laisser un témoignage via un lien d'invitation. */
export function TestimonialInviteForm() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";
  const [status, setStatus] = useState<"loading" | "ok" | "invalid">("loading");
  const [authorName, setAuthorName] = useState("");
  const [quote, setQuote] = useState("");
  const [rating, setRating] = useState(5);
  const [file, setFile] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }
    let cancelled = false;
    void fetch(`/api/testimonials/invite?token=${encodeURIComponent(token)}`)
      .then((res) => {
        if (cancelled) return;
        setStatus(res.ok ? "ok" : "invalid");
      })
      .catch(() => {
        if (!cancelled) setStatus("invalid");
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const submit = async () => {
    if (rating < 1) {
      setError(t("reviews.invite.ratingRequired"));
      return;
    }
    setPending(true);
    setError(null);
    const body = new FormData();
    body.append("token", token);
    body.append("authorName", authorName);
    body.append("quote", quote);
    body.append("rating", String(rating));
    if (file) body.append("image", file);
    const res = await fetch("/api/testimonials/submit", {
      method: "POST",
      body,
    });
    setPending(false);
    if (!res.ok) {
      setError(t("reviews.invite.error"));
      return;
    }
    setDone(true);
  };

  if (status === "loading") {
    return <p className="text-muted">{t("reviews.invite.loading")}</p>;
  }

  if (status === "invalid") {
    return (
      <div className="space-y-3">
        <h1 className="font-serif text-4xl text-primary">
          {t("reviews.invite.invalidTitle")}
        </h1>
        <p className="text-muted">{t("reviews.invite.invalidBody")}</p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="space-y-4">
        <h1 className="font-serif text-4xl text-primary">
          {t("reviews.invite.thanksTitle")}
        </h1>
        <p className="text-muted">{t("reviews.invite.thanksBody")}</p>
        <Button href="/temoignages">{t("reviews.invite.seePage")}</Button>
      </div>
    );
  }

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <header className="space-y-3">
        <h1 className="font-serif text-4xl text-primary sm:text-5xl">
          {t("reviews.invite.title")}
        </h1>
        <p className="max-w-xl text-muted">{t("reviews.invite.subtitle")}</p>
      </header>

      <label className="block space-y-1 text-sm">
        <span className="text-muted">{t("reviews.invite.name")}</span>
        <input
          required
          minLength={2}
          className="min-h-12 w-full rounded-xl border border-border bg-background px-3 py-2.5 outline-none focus:border-accent"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
        />
      </label>

      <div className="space-y-2">
        <p className="text-sm text-muted">{t("reviews.invite.rating")}</p>
        <RatingInput value={rating} onChange={setRating} disabled={pending} />
      </div>

      <label className="block space-y-1 text-sm">
        <span className="text-muted">{t("reviews.invite.quote")}</span>
        <textarea
          required
          minLength={8}
          rows={5}
          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 outline-none focus:border-accent"
          value={quote}
          onChange={(e) => setQuote(e.target.value)}
        />
      </label>

      <label className="block space-y-1 text-sm">
        <span className="text-muted">{t("reviews.invite.photo")}</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="block w-full text-sm"
          disabled={pending}
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </label>

      {error ? <p className="text-sm text-accent">{error}</p> : null}

      <Button type="submit" size="lg" pending={pending}>
        {pending ? t("reviews.invite.submitting") : t("reviews.invite.submit")}
      </Button>
    </form>
  );
}
