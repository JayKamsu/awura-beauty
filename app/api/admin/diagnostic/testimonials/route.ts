import { NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/infrastructure/supabase/admin-auth";
import { listAllDiagnosticTestimonials } from "@/lib/infrastructure/supabase/order-reviews";

/** Liste tous les témoignages diagnostic — admin uniquement. */
export async function GET(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if ("error" in auth) return auth.error;
  const testimonials = await listAllDiagnosticTestimonials();
  return NextResponse.json({ testimonials });
}
