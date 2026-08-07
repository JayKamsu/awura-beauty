import { NextResponse } from "next/server";
import { container } from "@/lib/application/container";

type Params = { params: Promise<{ pageKey: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { pageKey } = await params;
  const layout = await container.pages.getPageLayout(pageKey);
  return NextResponse.json({ layout });
}
