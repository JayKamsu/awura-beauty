"use client";

import { useTranslation } from "react-i18next";

type BlogIndexHeaderProps = {
  variant: "articles" | "tutorials";
};

export function BlogIndexHeader({ variant }: BlogIndexHeaderProps) {
  const { t } = useTranslation();

  return (
    <header className="max-w-2xl space-y-3">
      <h1 className="font-serif text-4xl text-primary sm:text-5xl">
        {t(variant === "tutorials" ? "blog.tutorialsTitle" : "blog.title")}
      </h1>
      <p className="text-muted">
        {t(
          variant === "tutorials"
            ? "blog.tutorialsSubtitle"
            : "blog.subtitle",
        )}
      </p>
    </header>
  );
}
