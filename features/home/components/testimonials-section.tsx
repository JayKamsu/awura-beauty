"use client";

import Image from "next/image";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Stars } from "@/components/ui/stars";
import { HOME_IMAGES } from "@/features/home/data/content";

const TESTIMONIALS = [
  { key: "sarah", image: HOME_IMAGES.testimonials[0] },
  { key: "amina", image: HOME_IMAGES.testimonials[1] },
  { key: "lea", image: HOME_IMAGES.testimonials[2] },
] as const;

export function TestimonialsSection() {
  const { t } = useTranslation();

  return (
    <section className="bg-background-alt">
      <div className="mx-auto max-w-7xl space-y-10 px-4 py-16 md:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="font-serif text-3xl text-primary sm:text-4xl">
            {t("home.testimonials.title")}
          </h2>
          <Button href="/avis" variant="ghost" className="self-start uppercase tracking-wide text-accent sm:self-auto">
            {t("home.testimonials.seeAll")}
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {TESTIMONIALS.map((item) => (
            <article
              key={item.key}
              className="flex gap-4 rounded-2xl bg-background p-5"
            >
              <div className="relative size-14 shrink-0 overflow-hidden rounded-full">
                <Image
                  src={item.image}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              </div>
              <div className="space-y-2">
                <Stars />
                <p className="text-sm italic leading-relaxed text-foreground/90">
                  “{t(`home.testimonials.items.${item.key}.quote`)}”
                </p>
                <p className="text-sm font-medium text-muted">
                  — {t(`home.testimonials.items.${item.key}.name`)}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
