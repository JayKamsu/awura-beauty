import { NextResponse } from "next/server";
import { container } from "@/lib/application/container";
import type { PageLocale } from "@/lib/domain";

type Params = { params: Promise<{ pageKey: string }> };

function parseLocale(value: string | null): PageLocale {
  if (value === "en" || value === "es" || value === "fr") return value;
  return "fr";
}

export async function GET(request: Request, { params }: Params) {
  const { pageKey } = await params;
  const locale = parseLocale(new URL(request.url).searchParams.get("locale"));
  const layout = await container.pages.getPageLayout(pageKey, locale);
  return NextResponse.json({ layout });
}
