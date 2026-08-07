import { NextResponse } from "next/server";
import { uploadPublicImage, type StorageFolder } from "@/lib/connectors/supabase-storage";
import { requireAdminFromRequest } from "@/lib/infrastructure/supabase/admin-auth";

const FOLDERS = new Set<StorageFolder>(["products", "blog", "pages", "uploads"]);

export async function POST(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if ("error" in auth) return auth.error;

  const form = await request.formData();
  const file = form.get("file");
  const folderRaw = String(form.get("folder") ?? "uploads");
  const folder = (FOLDERS.has(folderRaw as StorageFolder)
    ? folderRaw
    : "uploads") as StorageFolder;

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file required" }, { status: 400 });
  }

  const result = await uploadPublicImage(file, folder);
  if (!result.url) {
    return NextResponse.json(
      { error: result.error ?? "Upload failed" },
      { status: 400 },
    );
  }

  return NextResponse.json({ url: result.url });
}
