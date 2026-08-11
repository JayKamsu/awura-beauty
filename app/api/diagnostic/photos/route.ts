import { NextResponse } from "next/server";
import { uploadDiagnosticPhoto } from "@/lib/infrastructure/supabase/storage";
import type { DiagnosticPhotoAngle } from "@/lib/domain/diagnostic";

const ANGLES = new Set<DiagnosticPhotoAngle>([
  "face",
  "profil_gauche",
  "profil_droit",
  "arriere",
  "pointes",
]);

/** Upload une photo de diagnostic (face/profils/arrière/pointes) dans le bucket privé, rattachée à une session client. */
export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");
  const angle = String(form.get("angle") ?? "");
  const sessionId = String(form.get("sessionId") ?? "").trim();

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file required" }, { status: 400 });
  }
  if (!ANGLES.has(angle as DiagnosticPhotoAngle)) {
    return NextResponse.json({ error: "Invalid angle" }, { status: 400 });
  }
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }

  const result = await uploadDiagnosticPhoto(file, sessionId);
  if (!result.path) {
    return NextResponse.json(
      { error: result.error ?? "Upload failed" },
      { status: 400 },
    );
  }

  return NextResponse.json({ path: result.path, angle });
}
