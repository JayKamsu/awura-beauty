# E-mails Auth Awura Beauty

Templates HTML à coller dans Supabase → **Authentication → Emails → Templates**.
Le SMTP custom doit être activé avant de pouvoir les modifier.

## Fichiers & sujets

| Template Supabase | Fichier | Subject |
| --- | --- | --- |
| Confirm sign up | `confirm-signup.html` | `Confirme ton e-mail — Awura Beauty` |
| Invite user | `invite-user.html` | `Invitation Awura Beauty` |
| Magic link | `magic-link.html` | `Ton lien de connexion — Awura Beauty` |
| Change email address | `change-email.html` | `Confirme ton nouvel e-mail — Awura Beauty` |
| Reset password | `reset-password.html` | `Réinitialise ton mot de passe — Awura Beauty` |
| Reauthentication | `reauthentication.html` | `Ton code Awura Beauty` |

Pour chaque template : ouvrir l’onglet → coller le **Subject** → coller le HTML du fichier → Save.

## SMTP (obligatoire pour éditer)

### Hostinger (recommandé si boîte `Care@…` déjà créée)

| Champ | Valeur |
| --- | --- |
| Sender email | `Care@awurabeauty.com` |
| Sender name | `Awura Beauty` |
| Host | `smtp.hostinger.com` |
| Port | `465` |
| Username | `Care@awurabeauty.com` |
| Password | mot de passe de la boîte |

### Alternative Resend

| Champ | Valeur |
| --- | --- |
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | clé API Resend (`re_…`) |
| Sender | adresse vérifiée sur le domaine |

## URLs de redirection

**Authentication → URL Configuration** :

- Site URL : `https://awurabeauty.com`
- Redirect URLs :
  - `https://awurabeauty.com/**`
  - `https://www.awurabeauty.com/**`
  - `http://localhost:3000/**`

Le code envoie déjà `emailRedirectTo` vers `/auth/callback`.

## Contournement temporaire (dev seulement)

**Authentication → Providers → Email** → désactiver **Confirm email**.
À ne **pas** laisser ainsi en production.
