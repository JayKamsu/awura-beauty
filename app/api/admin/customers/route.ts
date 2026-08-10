import { NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/infrastructure/supabase/admin-auth";
import { listAdminCustomers } from "@/lib/infrastructure/supabase/admin-dashboard";

/** Liste les clients pour le back-office (admin uniquement). */
export async function GET(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if ("error" in auth) return auth.error;
  const customers = await listAdminCustomers();
  return NextResponse.json({ customers });
}
