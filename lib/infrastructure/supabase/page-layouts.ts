import {
  createAdminSupabaseClient,
  createSupabaseClient,
} from "@/lib/infrastructure/supabase/client";
import {
  defaultLayoutFor,
  type PageLayout,
  type PageSectionConfig,
} from "@/lib/domain/page-layout";

function mapLayout(pageKey: string, row: Record<string, unknown> | null): PageLayout {
  if (!row) return defaultLayoutFor(pageKey);
  const sections = Array.isArray(row.sections)
    ? (row.sections as PageSectionConfig[])
    : defaultLayoutFor(pageKey).sections;
  return {
    pageKey,
    sections,
    updatedAt: row.updated_at ? String(row.updated_at) : undefined,
  };
}

export async function getPageLayout(pageKey: string): Promise<PageLayout> {
  const supabase = createSupabaseClient();
  if (!supabase) return defaultLayoutFor(pageKey);

  const { data, error } = await supabase
    .from("page_layouts")
    .select("*")
    .eq("page_key", pageKey)
    .maybeSingle();

  if (error || !data) return defaultLayoutFor(pageKey);
  return mapLayout(pageKey, data as Record<string, unknown>);
}

export async function listPageLayouts(): Promise<PageLayout[]> {
  const supabase = createSupabaseClient();
  if (!supabase) {
    return [defaultLayoutFor("home"), defaultLayoutFor("about")];
  }

  const { data, error } = await supabase.from("page_layouts").select("*");
  if (error || !data?.length) {
    return [defaultLayoutFor("home"), defaultLayoutFor("about")];
  }

  return data.map((row) =>
    mapLayout(String((row as { page_key: string }).page_key), row as Record<string, unknown>),
  );
}

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

  const { data, error } = await supabase
    .from("page_layouts")
    .upsert(
      {
        page_key: pageKey,
        sections,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "page_key" },
    )
    .select("*")
    .maybeSingle();

  if (error || !data) {
    return { layout: null, error: error?.message ?? "Unable to save layout" };
  }

  return {
    layout: mapLayout(pageKey, data as Record<string, unknown>),
    error: null,
  };
}
