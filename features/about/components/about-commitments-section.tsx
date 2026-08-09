"use client";

import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { COMMITMENT_KEYS } from "@/features/about/data/content";
import {
  cmsOr,
  parseCmsBlocks,
  usePageCmsFields,
} from "@/features/cms/context/page-cms-context";

const COMMITMENT_ICONS: Record<(typeof COMMITMENT_KEYS)[number], ReactNode> = {
  naturality: (
    <path d="M12 21c-4-3-7-6.2-7-10a7 7 0 0 1 14 0c0 3.8-3 7-7 10Zm0-10a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
  ),
  crueltyFree: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M8 12.5 10.5 15 16 9.5" />
    </>
  ),
  artisanal: <path d="M4 18h16M7 18V9l5-4 5 4v9M10 18v-4h4v4" />,
};

export function AboutCommitmentsSection() {
  const { t } = useTranslation();
  const cms = usePageCmsFields("commitments");
  const blocks = parseCmsBlocks(cms.body);

  const items = COMMITMENT_KEYS.map((key, index) => {
    const block = blocks[index];
    return {
      key,
      title: block?.title || t(`about.commitments.items.${key}.title`),
      description:
        block?.body || t(`about.commitments.items.${key}.description`),
    };
  });

  return (
    <section className="bg-primary text-background">
      <div className="mx-auto max-w-7xl space-y-10 px-4 py-14 md:px-6 lg:py-16">
        <div className="mx-auto max-w-2xl space-y-3 text-center">
          <h2 className="font-serif text-3xl tracking-wide sm:text-4xl">
            {cmsOr(cms, "title", t("about.commitments.title"))}
          </h2>
          <p className="text-background/80">
            {cmsOr(cms, "subtitle", t("about.commitments.subtitle"))}
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-3">
          {items.map((item) => (
            <div key={item.key} className="space-y-4 text-center sm:text-left">
              <div className="mx-auto inline-flex size-11 items-center justify-center rounded-2xl bg-background/10 text-accent-light sm:mx-0">
                <svg
                  viewBox="0 0 24 24"
                  className="size-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                >
                  {COMMITMENT_ICONS[item.key]}
                </svg>
              </div>
              <h3 className="font-serif text-xl tracking-wide">{item.title}</h3>
              <p className="text-sm leading-relaxed text-background/80">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
