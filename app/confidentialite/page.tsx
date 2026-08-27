import { LegalPage } from "@/features/legal/legal-page";
import { legalPageMetadata } from "@/lib/legal/pages";

export const metadata = legalPageMetadata("confidentialite");

/** Page Politique de confidentialité et RGPD. */
export default function ConfidentialitePage() {
  return <LegalPage slug="confidentialite" />;
}
