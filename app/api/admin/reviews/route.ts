import { NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/infrastructure/supabase/admin-auth";
import { listAllReviews } from "@/lib/infrastructure/supabase/order-reviews";

export async function GET(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if ("error" in auth) return auth.error;
  const reviews = await listAllReviews();
  return NextResponse.json({ reviews });
}
