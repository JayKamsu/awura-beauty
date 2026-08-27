import { LegalPage } from "@/features/legal/legal-page";
import { legalPageMetadata } from "@/lib/legal/pages";

export const metadata = legalPageMetadata("mentions-legales");

/** Page Mentions légales (éditeur, hébergeur, propriété intellectuelle). */
export default function MentionsLegalesPage() {
  return <LegalPage slug="mentions-legales" />;
}
