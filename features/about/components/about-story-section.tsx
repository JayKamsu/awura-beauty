"use client";

import Image from "next/image";
import { useTranslation } from "react-i18next";
import { ABOUT_IMAGES } from "@/features/about/data/content";
import {
  cmsOr,
  usePageCmsFields,
} from "@/features/cms/context/page-cms-context";

export function AboutStorySection() {
  const { t } = useTranslation();
  const cms = usePageCmsFields("story");
  const title = cmsOr(cms, "title", t("about.story.title"));
  const body = cms.body?.trim();
  const image = cmsOr(cms, "image_url", ABOUT_IMAGES.story);

  return (
    <section className="bg-background">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 md:px-6 lg:grid-cols-2 lg:gap-14 lg:py-20">
        <div className="space-y-6">
          <p className="text-sm uppercase tracking-[0.18em] text-accent">
            {cmsOr(cms, "subtitle", t("about.story.eyebrow"))}
          </p>
          <h1 className="font-serif text-4xl leading-tight text-primary sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          <div className="space-y-4 text-base leading-relaxed text-muted sm:text-lg">
            {body ? (
              body.split(/\n+/).map((paragraph) => (
                <p key={paragraph.slice(0, 24)}>{paragraph}</p>
              ))
            ) : (
              <>
                <p>{t("about.story.paragraph1")}</p>
                <p>{t("about.story.paragraph2")}</p>
                <p>{t("about.story.paragraph3")}</p>
              </>
            )}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem]">
            <Image
              src={image}
              alt={t("about.story.imageAlt")}
              fill
              className="object-cover object-top"
              sizes="(max-width: 1024px) 90vw, 45vw"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
