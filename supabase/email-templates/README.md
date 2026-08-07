# Templates e-mail Supabase (Awura Beauty)

## 1. URLs de redirection (obligatoire)

Dashboard Supabase → **Authentication → URL Configuration** :

| Champ | Valeur |
| --- | --- |
| Site URL | `https://awurabeauty.com` |
| Redirect URLs | `https://awurabeauty.com/**` |
| | `https://www.awurabeauty.com/**` |
| | `http://localhost:3000/**` |

## 2. Template confirmation

Dashboard → **Authentication → Email Templates → Confirm signup** :

1. Subject : `Confirme ton e-mail — Awura Beauty`
2. Body : coller le contenu de `confirm-signup.html`
3. Enregistrer

Le lien de confirmation redirige vers `/auth/callback` (défini dans le code via `emailRedirectTo`).
