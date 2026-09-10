import { NextResponse } from "next/server";
import { catalogPort } from "@/lib/application/container";

const MAX_PAGE_SIZE = 24;

/** Catalogue public : produits visibles sur le site (accueil, etc.). */
export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("bestsellers") === "1") {
    const products = await catalogPort.listHomeBestsellers();
    return NextResponse.json({ products });
  }
  const rawSize = Number(url.searchParams.get("pageSize") ?? "8");
  const pageSize = Number.isFinite(rawSize)
    ? Math.min(MAX_PAGE_SIZE, Math.max(1, rawSize))
    : 8;
  const result = await catalogPort.listProducts({
    page: 1,
    pageSize,
    sort: "recent",
  });
  return NextResponse.json({ products: result.products });
}
