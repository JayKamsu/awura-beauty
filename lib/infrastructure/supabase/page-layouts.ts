import {
  createAdminSupabaseClient,
  createSupabaseClient,
} from "@/lib/infrastructure/supabase/client";
import {
  defaultLayoutFor,
  isPageSectionId,
  PAGE_FIELD_KEYS,
  PAGE_LOCALES,
  type PageFieldKey,
  type PageLayout,
  type PageLocale,
  type PageSectionConfig,
  type PageSectionFields,
  type PageSectionId,
} from "@/lib/domain/page-layout";

type SectionRow = {
  id: string;
  page_key: string;
  section_key: string;
  position: number;
  enabled: boolean;
  updated_at: string;
};

type FieldRow = {
  id: string;
  section_id: string;
  field_key: string;
  locale: string;
  value: string;
};

function emptyFieldsByLocale(): Partial<Record<PageLocale, PageSectionFields>> {
  return { fr: {}, en: {}, es: {} };
}

function assembleSections(
  sectionRows: SectionRow[],
  fieldRows: FieldRow[],
  locale?: PageLocale,
): PageSectionConfig[] {
  const fieldsBySection = new Map<string, FieldRow[]>();
  for (const field of fieldRows) {
    const list = fieldsBySection.get(field.section_id) ?? [];
    list.push(field);
    fieldsBySection.set(field.section_id, list);
  }

  return sectionRows
    .slice()
    .sort((a, b) => a.position - b.position)
    .filter((row) => isPageSectionId(row.section_key))
    .map((row) => {
      const fieldsByLocale = emptyFieldsByLocale();
      for (const field of fieldsBySection.get(row.id) ?? []) {
        if (!PAGE_LOCALES.includes(field.locale as PageLocale)) continue;
        if (!PAGE_FIELD_KEYS.includes(field.field_key as PageFieldKey)) continue;
        const localeKey = field.locale as PageLocale;
        const bucket = fieldsByLocale[localeKey] ?? {};
        bucket[field.field_key as PageFieldKey] = field.value;
        fieldsByLocale[localeKey] = bucket;
      }

      const config: PageSectionConfig = {
        id: row.section_key as PageSectionId,
        enabled: row.enabled,
        rowId: row.id,
        position: row.position,
        fieldsByLocale,
      };

      if (locale) {
        config.fields = { ...(fieldsByLocale[locale] ?? {}) };
      }

      return config;
    });
}

async function fetchLayout(
  pageKey: string,
  locale?: PageLocale,
): Promise<PageLayout> {
  const supabase = createSupabaseClient();
  if (!supabase) return defaultLayoutFor(pageKey);

  const { data: sections, error } = await supabase
    .from("page_sections")
    .select("*")
    .eq("page_key", pageKey)
    .order("position", { ascending: true });

  if (error || !sections?.length) return defaultLayoutFor(pageKey);

  const sectionRows = sections as SectionRow[];
  const ids = sectionRows.map((s) => s.id);
  const { data: fields } = await supabase
    .from("page_section_fields")
    .select("*")
    .in("section_id", ids);

  const assembled = assembleSections(
    sectionRows,
    (fields ?? []) as FieldRow[],
    locale,
  );

  const updatedAt = sectionRows
    .map((s) => s.updated_at)
    .sort()
    .at(-1);

  return {
    pageKey,
    sections: assembled.length ? assembled : defaultLayoutFor(pageKey).sections,
    updatedAt,
  };
}

/** Layout d'une page pour une langue donnée ; retombe sur le layout par défaut si Supabase est indisponible ou vide. */
export async function getPageLayout(
  pageKey: string,
  locale: PageLocale = "fr",
): Promise<PageLayout> {
  return fetchLayout(pageKey, locale);
}

/** Layouts de toutes les pages configurées, groupés par page_key (admin). */
export async function listPageLayouts(): Promise<PageLayout[]> {
  const supabase = createSupabaseClient();
  if (!supabase) {
    return [defaultLayoutFor("home"), defaultLayoutFor("about")];
  }

  const { data: sections, error } = await supabase
    .from("page_sections")
    .select("*")
    .order("position", { ascending: true });

  if (error || !sections?.length) {
    return [defaultLayoutFor("home"), defaultLayoutFor("about")];
  }

  const sectionRows = sections as SectionRow[];
  const ids = sectionRows.map((s) => s.id);
  const { data: fields } = await supabase
    .from("page_section_fields")
    .select("*")
    .in("section_id", ids);

  const fieldRows = (fields ?? []) as FieldRow[];
  const pageKeys = [...new Set(sectionRows.map((s) => s.page_key))];

  return pageKeys.map((pageKey) => {
    const rows = sectionRows.filter((s) => s.page_key === pageKey);
    const rowIds = new Set(rows.map((r) => r.id));
    const pageFields = fieldRows.filter((f) => rowIds.has(f.section_id));
    return {
      pageKey,
      sections: assembleSections(rows, pageFields),
      updatedAt: rows.map((r) => r.updated_at).sort().at(-1),
    };
  });
}

/** Sauvegarde le layout d'une page section par section, langue par langue (admin, service_role requis en production). */
export async function savePageLayout(
  pageKey: string,
  sections: PageSectionConfig[],
): Promise<{ layout: PageLayout | null; error: string | null }> {
  const supabase = createAdminSupabaseClient();
  if (!supabase) {
    return {
      layout: null,
      error:
        process.env.NODE_ENV === "production"
          ? "SUPABASE_SERVICE_ROLE_KEY is required in production"
          : "Supabase is not configured",
    };
  }

  const now = new Date().toISOString();

  for (let index = 0; index < sections.length; index++) {
    const section = sections[index];
    const { data: upserted, error: sectionError } = await supabase
      .from("page_sections")
      .upsert(
        {
          page_key: pageKey,
          section_key: section.id,
          position: index,
          enabled: section.enabled,
          updated_at: now,
        },
        { onConflict: "page_key,section_key" },
      )
      .select("*")
      .maybeSingle();

    if (sectionError || !upserted) {
      return {
        layout: null,
        error: sectionError?.message ?? "Unable to save section",
      };
    }

    const sectionId = String((upserted as SectionRow).id);
    const byLocale = section.fieldsByLocale ?? {};

    for (const locale of PAGE_LOCALES) {
      const fields = byLocale[locale] ?? {};
      for (const fieldKey of PAGE_FIELD_KEYS) {
        const value = fields[fieldKey] ?? "";
        const { error: fieldError } = await supabase
          .from("page_section_fields")
          .upsert(
            {
              section_id: sectionId,
              field_key: fieldKey,
              locale,
              value,
            },
            { onConflict: "section_id,field_key,locale" },
          );

        if (fieldError) {
          return { layout: null, error: fieldError.message };
        }
      }
    }
  }

  const layout = await fetchLayout(pageKey);
  return { layout, error: null };
}
