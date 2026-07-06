# Auth admin Nahda Smart

Phase 4B met en place une base d'authentification admin securisee sans construire le dashboard complet.

## Strategie

- Login admin par email + mot de passe.
- Le mot de passe n'est jamais stocke en clair.
- `AdminUser.passwordHash` doit etre un hash `scrypt:<salt>:<hash>`.
- La session admin est opaque : le navigateur recoit uniquement un token aleatoire.
- La DB stocke uniquement le hash SHA-256 du token dans `AdminSession.tokenHash`.
- Cookie de session : `HttpOnly`, `SameSite=Lax`, `Secure` en production, limite a `/admin`, expiration 8 heures.
- `proxy.ts` fait seulement un controle optimiste de presence du cookie pour `/admin/*`.
- Les permissions reelles sont verifiees cote serveur par `requireAdmin`, `requireRole` et `requireAdminSection`.

## Creer un admin local

1. Generer un hash :

```powershell
npm.cmd run admin:hash
```

2. Copier uniquement la valeur `ADMIN_PASSWORD_HASH="scrypt:..."` dans `.env`.

3. Verifier aussi :

```env
ADMIN_EMAIL="admin@nahdasmart.ma"
ADMIN_NAME="Super Admin Nahda Smart"
```

4. Creer ou mettre a jour le super admin :

```powershell
npm.cmd run admin:upsert
```

Le script refuse de creer un admin si `ADMIN_PASSWORD_HASH` est absent, placeholder ou invalide.

Option plus simple pour un poste local :

```powershell
npm.cmd run admin:setup-local
```

Cette commande demande le mot de passe en saisie masquee, genere le hash, met `.env` a jour localement et cree/met a jour le `SUPER_ADMIN` sans afficher le hash.

## Routes

- `/admin/login` : formulaire de connexion.
- `/admin/logout` : fermeture de session.
- `/admin/unauthorized` : role insuffisant.
- `/admin` : shell admin protege.

## RBAC

- `SUPER_ADMIN` : acces total.
- `MANAGER` : produits, commandes, clients, fournisseurs, stock, depots, rapports.
- `SELLER` : commandes, clients, devis.
- `STOCK_MANAGER` : produits, stock, depots.
- `ACCOUNTANT` : revenus, marges, fournisseurs, commandes.
- `DELIVERY` : livraison, commandes.

La matrice se trouve dans `lib/auth/permissions.ts`.

## Proteger une future route admin

Dans une page ou action serveur :

```ts
import { requireAdminSection } from "@/lib/auth/admin-auth";

export default async function ProductsAdminPage() {
  const admin = await requireAdminSection("products");
  return <div>{admin.name}</div>;
}
```

Pour une action serveur sensible, refaire la verification dans l'action elle-meme.

## Logs admin

Les actions suivantes sont journalisees dans `AdminLog` :

- `ADMIN_LOGIN_SUCCESS`
- `ADMIN_LOGIN_FAILED`
- `ADMIN_LOGOUT`
- `ADMIN_UNAUTHORIZED_ACCESS`
- `ADMIN_UPSERT`

Ne jamais logger de mot de passe, hash complet, token de session ou secret.

## Rate limit

Le login utilise un rate limit en memoire pour le developpement :

- 5 tentatives echouees par fenetre de 15 minutes.
- blocage temporaire 10 minutes.
- message volontairement generique.

En production multi-instance, remplacer cette memoire locale par Redis, Upstash, PostgreSQL ou un service equivalent.
