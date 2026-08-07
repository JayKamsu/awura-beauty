"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

type SearchFormProps = {
  initialQuery?: string;
};

export function SearchForm({ initialQuery = "" }: SearchFormProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);

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
      className="flex w-full flex-col gap-3 sm:flex-row sm:items-stretch"
    >
      <label className="sr-only" htmlFor="search-query">
        {t("search.queryLabel")}
      </label>
      <input
        id="search-query"
        name="q"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t("search.placeholder")}
        autoFocus
        className="min-h-12 w-full flex-1 rounded-xl border border-border bg-background px-4 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-accent"
      />
      <Button type="submit" size="lg" className="sm:shrink-0">
        {t("search.submit")}
      </Button>
    </form>
  );
}
