"use client";

import Image from "next/image";
import { useTranslation } from "react-i18next";
import { ABOUT_IMAGES } from "@/features/about/data/content";
import {
  cmsOr,
  usePageCmsFields,
} from "@/features/cms/context/page-cms-context";

/** Section « À propos » présentant la fondatrice d'Awura Beauty, avec portrait et biographie éditables via le CMS. */
export function AboutFounderSection() {
  const { t } = useTranslation();
  const cms = usePageCmsFields("founder");
  const name = cmsOr(cms, "title", t("about.founder.name"));
  const role = cmsOr(cms, "subtitle", t("about.founder.role"));
  const body = cms.body?.trim();
  const image = cmsOr(cms, "image_url", ABOUT_IMAGES.founder);

  return (
    <section className="bg-background-alt/60">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 md:px-6 lg:grid-cols-2 lg:gap-14 lg:py-20">
        <div className="relative order-2 mx-auto w-full max-w-md lg:order-1 lg:mx-0 lg:max-w-none">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem]">
            <Image
              src={image}
              alt={t("about.founder.imageAlt")}
              fill
              className="object-cover object-top"
              sizes="(max-width: 1024px) 90vw, 45vw"
            />
          </div>
        </div>

        <div className="order-1 space-y-6 lg:order-2">
          <p className="text-sm uppercase tracking-[0.18em] text-accent">
            {t("about.founder.eyebrow")}
          </p>
          <div>
            <h2 className="font-serif text-3xl leading-tight text-primary sm:text-4xl">
              {name}
            </h2>
            <p className="mt-1 text-base text-muted">{role}</p>
          </div>
          <div className="space-y-4 text-base leading-relaxed text-muted sm:text-lg">
            {body ? (
              body.split(/\n+/).map((paragraph) => (
                <p key={paragraph.slice(0, 24)}>{paragraph}</p>
              ))
            ) : (
              <>
                <p>{t("about.founder.paragraph1")}</p>
                <p>{t("about.founder.paragraph2")}</p>
                <p>{t("about.founder.paragraph3")}</p>
                <p>{t("about.founder.paragraph4")}</p>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
