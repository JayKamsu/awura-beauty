/**
 * Connecteur Storage Supabase — seul point d’entrée UI/API pour les uploads.
 */
export {
  uploadPublicImage,
  ensureMediaBucket,
  type StorageFolder,
} from "@/lib/infrastructure/supabase/storage";
