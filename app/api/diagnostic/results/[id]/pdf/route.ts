import { NextResponse } from "next/server";
import { renderDiagnosticResultPdf } from "@/lib/application/diagnostic/result-pdf";
import {
  getUserFromAccessToken,
  isAdminUser,
} from "@/lib/infrastructure/supabase/admin-auth";
import { getDiagnosticById } from "@/lib/infrastructure/supabase/diagnostics";

function bearer(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim() || null;
}

type Params = { params: Promise<{ id: string }> };

/** PDF du bilan diagnostic (contenu riche rédigé par l'admin) — client propriétaire ou admin. */
export async function GET(request: Request, { params }: Params) {
  const { id: rawId } = await params;
  const id = String(rawId ?? "").trim();
  if (!id) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const diagnostic = await getDiagnosticById(id);
  if (!diagnostic) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const accessToken = bearer(request);
  const user = accessToken ? await getUserFromAccessToken(accessToken) : null;
  const isAdmin = isAdminUser(user);
  const isOwner = Boolean(user) && user!.id === diagnostic.user_id;

  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const pdf = await renderDiagnosticResultPdf(diagnostic);

  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="bilan-diagnostic-awura-${diagnostic.id}.pdf"`,
    },
  });
}
