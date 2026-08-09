"use client";

import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { MISSION_KEYS } from "@/features/about/data/content";
import {
  cmsOr,
  parseCmsBlocks,
  usePageCmsFields,
} from "@/features/cms/context/page-cms-context";

const MISSION_ICONS: Record<(typeof MISSION_KEYS)[number], ReactNode> = {
  expertise: (
    <path d="M8 11c0-2.2 1.8-4 4-4s4 1.8 4 4c0 1.5-.8 2.8-2 3.5V17H10v-2.5c-1.2-.7-2-2-2-3.5Z M9 19h6" />
  ),
  natural: (
    <path d="M12 21c-4-3-7-6.2-7-10a7 7 0 0 1 14 0c0 3.8-3 7-7 10Zm0-10a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
  ),
  results: (
    <path d="M12 3 14.2 8l5.3.4-4.1 3.5 1.3 5.2L12 14.6 7.3 17.1l1.3-5.2L4.5 8.4 9.8 8 12 3Z" />
  ),
  love: (
    <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />
  ),
};

export function AboutMissionSection() {
  const { t } = useTranslation();
  const cms = usePageCmsFields("mission");
  const blocks = parseCmsBlocks(cms.body);

  const items = MISSION_KEYS.map((key, index) => {
    const block = blocks[index];
    return {
      key,
      title: block?.title || t(`about.mission.items.${key}.title`),
      body: block?.body || t(`about.mission.items.${key}.body`),
    };
  });

  return (
    <section className="bg-background-alt">
      <div className="mx-auto max-w-7xl space-y-12 px-4 py-16 md:px-6">
        <div className="mx-auto max-w-2xl space-y-4 text-center">
          <h2 className="font-serif text-3xl text-primary sm:text-4xl">
            {cmsOr(cms, "title", t("about.mission.title"))}
          </h2>
          <p className="leading-relaxed text-muted">
            {cmsOr(cms, "subtitle", t("about.mission.subtitle"))}
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2">
          {items.map((item) => (
            <article
              key={item.key}
              className="space-y-4 rounded-3xl bg-background p-6 md:p-8"
            >
              <div className="inline-flex size-12 items-center justify-center text-accent">
                <svg
                  viewBox="0 0 24 24"
                  className="size-8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  {MISSION_ICONS[item.key]}
                </svg>
              </div>
              <h3 className="font-serif text-2xl text-primary">{item.title}</h3>
              <p className="leading-relaxed text-muted">{item.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
