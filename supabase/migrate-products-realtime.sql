-- Publie les changements produits vers Supabase Realtime
-- (l’onglet boutique public se met à jour sans rechargement manuel).

do $$
begin
  begin
    alter publication supabase_realtime add table public.products;
  exception when duplicate_object then null;
  end;
end $$;
