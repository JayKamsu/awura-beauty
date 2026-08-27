import { LegalPage } from "@/features/legal/legal-page";
import { legalPageMetadata } from "@/lib/legal/pages";

export const metadata = legalPageMetadata("informations-entreprise");

/** Page d’identité légale : marque, publication et coordonnées. */
export default function CompanyInformationPage() {
  return <LegalPage slug="informations-entreprise" />;
}
