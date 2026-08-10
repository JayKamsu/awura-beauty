import { NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/infrastructure/supabase/admin-auth";
import {
  adminDeletePost,
  adminListPosts,
  adminUpsertPost,
  type BlogPostInput,
} from "@/lib/infrastructure/supabase/admin-blog";

/** Liste tous les articles de blog — admin uniquement. */
export async function GET(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if ("error" in auth) return auth.error;
  const posts = await adminListPosts();
  return NextResponse.json({ posts });
}

/** Crée ou met à jour un article de blog — admin uniquement. */
export async function POST(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if ("error" in auth) return auth.error;

  const body = (await request.json()) as BlogPostInput;
  const result = await adminUpsertPost(body);
  if (!result.post) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ post: result.post });
}

/** Supprime un article de blog par id — admin uniquement. */
export async function DELETE(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const result = await adminDeletePost(id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
