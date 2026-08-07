"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AboutCommitmentsSection } from "@/features/about/components/about-commitments-section";
import { AboutCtaSection } from "@/features/about/components/about-cta-section";
import { AboutMissionSection } from "@/features/about/components/about-mission-section";
import { AboutStorySection } from "@/features/about/components/about-story-section";
import {
  DEFAULT_ABOUT_SECTIONS,
  type PageSectionConfig,
  type PageSectionId,
} from "@/lib/domain/page-layout";

const SECTION_MAP: Partial<Record<PageSectionId, ReactNode>> = {
  story: <AboutStorySection />,
  mission: <AboutMissionSection />,
  commitments: <AboutCommitmentsSection />,
  cta: <AboutCtaSection />,
};

export default function AboutPage() {
  const [sections, setSections] =
    useState<PageSectionConfig[]>(DEFAULT_ABOUT_SECTIONS);

  useEffect(() => {
    void fetch("/api/pages/about")
      .then((res) => res.json())
      .then((json: { layout?: { sections?: PageSectionConfig[] } }) => {
        if (json.layout?.sections?.length) {
          setSections(json.layout.sections);
        }
      })
      .catch(() => undefined);
  }, []);

  return (
    <main className="flex w-full flex-1 flex-col">
      {sections
        .filter((section) => section.enabled)
        .map((section) => (
          <div key={section.id}>{SECTION_MAP[section.id] ?? null}</div>
        ))}
    </main>
  );
}
