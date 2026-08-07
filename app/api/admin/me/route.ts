import { requireAdminFromRequest } from "@/lib/infrastructure/supabase/admin-auth";

export async function GET(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if ("error" in auth) return auth.error;

  return Response.json({
    ok: true,
    email: auth.user.email ?? null,
  });
}
