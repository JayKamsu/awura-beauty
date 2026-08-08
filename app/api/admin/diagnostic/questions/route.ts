import { NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/infrastructure/supabase/admin-auth";
import {
  deleteDiagnosticOption,
  deleteDiagnosticQuestion,
  listDiagnosticQuestions,
  upsertDiagnosticOption,
  upsertDiagnosticQuestion,
} from "@/lib/infrastructure/supabase/diagnostic-admin";
import type { DiagnosticQuestionChannel } from "@/lib/domain/diagnostic";

export async function GET(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if ("error" in auth) return auth.error;
  const questions = await listDiagnosticQuestions({
    channel: "all",
    includeDisabled: true,
    locale: "fr",
  });
  return NextResponse.json({ questions });
}

export async function POST(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if ("error" in auth) return auth.error;
  const body = (await request.json()) as {
    entity?: "question" | "option";
    question?: {
      id?: string;
      questionKey: string;
      channel: DiagnosticQuestionChannel;
      position: number;
      enabled: boolean;
      titleFr: string;
      titleEn: string;
      titleEs: string;
      subtitleFr: string;
      subtitleEn: string;
      subtitleEs: string;
    };
    option?: {
      id?: string;
      questionId: string;
      valueKey: string;
      position: number;
      enabled: boolean;
      labelFr: string;
      labelEn: string;
      labelEs: string;
      hintFr: string;
      hintEn: string;
      hintEs: string;
      scoreRules: Record<string, number>;
    };
  };

  if (body.entity === "option" && body.option) {
    const option = await upsertDiagnosticOption(body.option);
    if (!option) {
      return NextResponse.json({ error: "Save failed" }, { status: 500 });
    }
    return NextResponse.json({ option });
  }

  if (body.question) {
    const question = await upsertDiagnosticQuestion(body.question);
    if (!question) {
      return NextResponse.json({ error: "Save failed" }, { status: 500 });
    }
    return NextResponse.json({ question });
  }

  return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
}

export async function DELETE(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if ("error" in auth) return auth.error;
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const entity = url.searchParams.get("entity") || "question";
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  const ok =
    entity === "option"
      ? await deleteDiagnosticOption(id)
      : await deleteDiagnosticQuestion(id);
  if (!ok) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
