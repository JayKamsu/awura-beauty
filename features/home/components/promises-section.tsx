"use client";

import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  parseCmsBlocks,
  usePageCmsFields,
} from "@/features/cms/context/page-cms-context";

const PROMISES = [
  {
    key: "expertise",
    icon: (
      <path d="M8 11c0-2.2 1.8-4 4-4s4 1.8 4 4c0 1.5-.8 2.8-2 3.5V17H10v-2.5c-1.2-.7-2-2-2-3.5Z M9 19h6" />
    ),
  },
  {
    key: "natural",
    icon: <path d="M12 21c-4-3-7-6.2-7-10a7 7 0 0 1 14 0c0 3.8-3 7-7 10Zm0-10a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />,
  },
  {
    key: "results",
    icon: (
      <path d="M12 3 14.2 8l5.3.4-4.1 3.5 1.3 5.2L12 14.6 7.3 17.1l1.3-5.2L4.5 8.4 9.8 8 12 3Z" />
    ),
  },
  {
    key: "love",
    icon: (
      <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />
    ),
  },
] as const;

/** Section « promesses » de la page d'accueil : met en avant les engagements de la marque (expertise, naturel, résultats, amour). */
export function PromisesSection() {
  const { t } = useTranslation();
  const cms = usePageCmsFields("promises");
  const blocks = parseCmsBlocks(cms.body);

  const items = PROMISES.map((promise, index) => {
    const block = blocks[index];
    return {
      key: promise.key,
      icon: promise.icon,
      title: block?.title || t(`home.promises.${promise.key}.title`),
      description:
        block?.body || t(`home.promises.${promise.key}.description`),
    };
  });

  return (
    <section className="bg-background-alt">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0 md:px-6 lg:py-16">
        {items.map((promise, index) => (
          <PromiseItem
            key={promise.key}
            icon={promise.icon}
            title={promise.title}
            description={promise.description}
            showDivider={index < items.length - 1}
          />
        ))}
      </div>
    </section>
  );
}

function PromiseItem({
  icon,
  title,
  description,
  showDivider,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  showDivider: boolean;
}) {
  return (
    <div
      className={`space-y-4 px-2 text-center lg:px-8 ${
        showDivider ? "lg:border-r lg:border-border" : ""
      }`}
    >
      <div className="mx-auto inline-flex size-12 items-center justify-center text-accent">
        <svg viewBox="0 0 24 24" className="size-8" fill="none" stroke="currentColor" strokeWidth="1.5">
          {icon}
        </svg>
      </div>
      <h2 className="font-serif text-xl text-primary sm:text-2xl">{title}</h2>
      <p className="text-sm leading-relaxed text-muted">{description}</p>
    </div>
  );
}
