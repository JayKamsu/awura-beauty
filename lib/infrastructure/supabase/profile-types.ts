/** Ligne du profil utilisateur (coordonnées de livraison). */
export type ProfileRow = {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  address_line1: string;
  city: string;
  postal_code: string;
  country: string;
  updated_at: string;
};

/** Champs modifiables lors de la mise à jour du profil. */
export type ProfileUpdateInput = {
  first_name: string;
  last_name: string;
  phone: string;
  address_line1: string;
  city: string;
  postal_code: string;
  country: string;
};

/** Profil suffisant pour ne pas redemander l’adresse au checkout. */
export function isShippingProfileComplete(
  profile: Pick<
    ProfileRow,
    | "first_name"
    | "last_name"
    | "phone"
    | "address_line1"
    | "city"
    | "postal_code"
    | "country"
  > | null,
): boolean {
  if (!profile) return false;
  return Boolean(
    profile.first_name.trim() &&
      profile.last_name.trim() &&
      profile.phone.trim() &&
      profile.address_line1.trim() &&
      profile.city.trim() &&
      profile.postal_code.trim() &&
      profile.country.trim(),
  );
}

/** Nom complet affichable, construit à partir du prénom et du nom. */
export function profileFullName(profile: Pick<ProfileRow, "first_name" | "last_name">) {
  return `${profile.first_name} ${profile.last_name}`.trim();
}
