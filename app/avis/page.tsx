import { redirect } from "next/navigation";

/** Ancienne URL des avis : redirige vers la page témoignages. */
export default function AvisRedirectPage() {
  redirect("/temoignages");
}
