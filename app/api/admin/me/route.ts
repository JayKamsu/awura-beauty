import {
  getUserFromAccessToken,
  isAdminUser,
} from "@/lib/infrastructure/supabase/admin-auth";

/**
 * Probe admin pour l’UI (pas une ressource sensible).
 * - 401 si non authentifié
 * - 200 `{ ok: false }` si connecté mais pas admin (évite le bruit console 403)
 * - 200 `{ ok: true, email }` si admin
 */
export async function GET(request: Request) {
  const header = request.headers.get("authorization");
  const token = header?.startsWith("Bearer ")
    ? header.slice("Bearer ".length)
    : null;

  if (!token) {
    return Response.json({ ok: false }, { status: 401 });
  }

  const user = await getUserFromAccessToken(token);
  if (!user) {
    return Response.json({ ok: false }, { status: 401 });
  }

  if (!isAdminUser(user)) {
    return Response.json({ ok: false, email: null });
  }

  return Response.json({
    ok: true,
    email: user.email ?? null,
  });
}
