"use client";

import Image from "next/image";
import { useTranslation } from "react-i18next";
import type { BlogContentBlock } from "@/lib/infrastructure/supabase/blog-types";

type RichContentProps = {
  blocks: BlogContentBlock[];
};

export function RichContent({ blocks }: RichContentProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {blocks.map((block, index) => {
        switch (block.type) {
          case "heading":
            return (
              <h2
                key={index}
                className="font-serif text-2xl text-primary sm:text-3xl"
              >
                {block.text}
              </h2>
            );
          case "paragraph":
            return (
              <p key={index} className="leading-relaxed text-foreground/90">
                {block.text}
              </p>
            );
          case "list":
            return (
              <ul key={index} className="list-disc space-y-2 pl-5 text-muted">
                {block.items.map((item) => (
                  <li key={item} className="leading-relaxed">
                    {item}
                  </li>
                ))}
              </ul>
            );
          case "tip":
            return (
              <aside
                key={index}
                className="rounded-2xl border border-border bg-background-alt px-5 py-4"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-accent">
                  {t("blog.tipLabel")}
                </p>
                <p className="mt-2 leading-relaxed text-muted">{block.text}</p>
              </aside>
            );
          case "image":
            return (
              <div
                key={index}
                className="relative aspect-[16/10] overflow-hidden rounded-3xl bg-background-alt"
              >
                <Image
                  src={block.src}
                  alt={block.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 720px"
                />
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
