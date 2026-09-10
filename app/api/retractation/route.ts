import { NextResponse } from "next/server";
import { parseWithdrawalInput } from "@/lib/domain/withdrawal";
import { submitWithdrawal } from "@/lib/application/withdrawal/submit-withdrawal";
import {
  RATE_LIMITS,
  rateLimitResponse,
} from "@/lib/infrastructure/security/http-rate-limit";

/** Enregistre une déclaration de rétractation et envoie l'accusé de réception. */
export async function POST(request: Request) {
  const limited = rateLimitResponse(request, RATE_LIMITS.retractationWrite);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const raw = body as Record<string, unknown>;
  if (String(raw.company ?? "").trim()) {
    return NextResponse.json({ ok: true });
  }

  const declaration = parseWithdrawalInput(body);
  if (!declaration) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const result = await submitWithdrawal(declaration);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 503 });
  }

  return NextResponse.json({
    ok: true,
    submittedAt: result.submittedAt,
  });
}
