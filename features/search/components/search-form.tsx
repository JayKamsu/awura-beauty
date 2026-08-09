"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";

type SearchFormProps = {
  initialQuery?: string;
  /** Focus auto (évité sur mobile pour ne pas zoomer / masquer le contenu). */
  autoFocus?: boolean;
};

/**
 * Champ recherche mobile-first : une ligne, 16px (anti-zoom iOS), bouton icône.
 */
export function SearchForm({
  initialQuery = "",
  autoFocus = false,
}: SearchFormProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    if (!autoFocus) return;
    const coarse =
      typeof window !== "undefined" &&
      window.matchMedia("(pointer: coarse)").matches;
    if (coarse) return;
    inputRef.current?.focus();
  }, [autoFocus]);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = query.trim();
    const href = trimmed
      ? `/recherche?q=${encodeURIComponent(trimmed)}`
      : "/recherche";
    router.push(href);
  };

  return (
    <form
      onSubmit={onSubmit}
      role="search"
      className="flex w-full items-stretch gap-2"
    >
      <label className="sr-only" htmlFor="search-query">
        {t("search.queryLabel")}
      </label>
      <div className="relative min-w-0 flex-1">
        <span
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
          aria-hidden
        >
          <svg
            viewBox="0 0 24 24"
            className="size-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
          >
            <circle cx="11" cy="11" r="6.5" />
            <path d="m16 16 4 4" />
          </svg>
        </span>
        <input
          ref={inputRef}
          id="search-query"
          name="q"
          type="search"
          enterKeyHint="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("search.placeholder")}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className="min-h-12 w-full rounded-xl border border-border bg-background py-3 pl-11 pr-4 text-base text-foreground outline-none transition placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/20 [&::-webkit-search-cancel-button]:appearance-none"
        />
      </div>
      <button
        type="submit"
        className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium uppercase tracking-wide text-background transition hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:px-5"
      >
        <span className="sm:hidden">{t("search.submitShort")}</span>
        <span className="hidden sm:inline">{t("search.submit")}</span>
      </button>
    </form>
  );
}
