import { NextResponse } from "next/server";
import { uploadPublicImage } from "@/lib/infrastructure/supabase/storage";
import {
  consumeInvite,
  findValidInvite,
  insertSiteTestimonial,
} from "@/lib/infrastructure/supabase/site-testimonials";

/** Enregistre un témoignage site à partir d'un lien d'invitation valide. */
export async function POST(request: Request) {
  const form = await request.formData();
  const token = String(form.get("token") ?? "").trim();
  const authorName = String(form.get("authorName") ?? "").trim().slice(0, 80);
  const quote = String(form.get("quote") ?? "").trim().slice(0, 2000);
  const rating = Math.round(Number(form.get("rating")));
  const file = form.get("image");

  if (!token || authorName.length < 2 || quote.length < 8) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
  }

  const invite = await findValidInvite(token);
  if (!invite) {
    return NextResponse.json({ error: "Invite expired" }, { status: 403 });
  }

  let imageUrl = "";
  if (file instanceof File && file.size > 0) {
    const uploaded = await uploadPublicImage(file, "testimonials");
    if (!uploaded.url) {
      return NextResponse.json(
        { error: uploaded.error ?? "Upload failed" },
        { status: 400 },
      );
    }
    imageUrl = uploaded.url;
  }

  const testimonial = await insertSiteTestimonial({
    authorName,
    quote,
    rating,
    imageUrl,
    published: true,
    source: "invite",
  });
  if (!testimonial) {
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }

  const consumed = await consumeInvite(invite.id, testimonial.id);
  if (!consumed) {
    return NextResponse.json({ error: "Invite already used" }, { status: 409 });
  }

  return NextResponse.json({ ok: true });
}
