# Production readiness Nahda Smart

Ce document fixe la checklist avant de deployer le ERP Nahda Smart sur VPS.

## Statut actuel

- Front public stable avec catalogue, produit, panier, checkout hors ligne, devis et suivi commande.
- Admin protege avec sessions DB, RBAC et `AdminLog`.
- Modules admin: commandes, devis, contacts, clients, catalogue, stock, fournisseurs, SAV, finance et analytics.
- Aucun paiement en ligne actif.
- Les donnees financieres et internes restent cote admin.

## Securite

- Sessions admin: cookie `HttpOnly`, `SameSite=Lax`, `Secure` en production, chemin `/admin`.
- Proxy admin: redirection vers `/admin/login` si cookie session absent.
- RBAC serveur: `requireAdmin`, `requireRole`, `requireAdminSection`.
- Headers globaux: CSP, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, HSTS en production.
- API publiques: validation Zod, controle same-origin si `Origin` est present, rate limiting en memoire.
- Login admin: rate limiting en memoire.
- Error boundary: aucun detail technique sensible affiche cote client.

## RBAC final

- `SUPER_ADMIN`: acces total.
- `MANAGER`: operations, catalogue, stock, fournisseurs, SAV, analytics, revenus et marges.
- `STOCK_MANAGER`: produits, fournisseurs, SAV, stock et depots.
- `ACCOUNTANT`: commandes, clients, fournisseurs, SAV, reports, revenus et marges.
- `SELLER`: produits en lecture, commandes, clients, devis, SAV.
- `DELIVERY`: livraison, commandes et SAV limite.

Les pages finance et analytics doivent rester protegees cote serveur. Les marges et couts ne doivent jamais etre retournes aux surfaces publiques.

## Performance

- Les pages publiques lisent des DTO publics, pas les modeles Prisma bruts.
- Les listes admin sont paginees.
- Les analytics sont calculees cote serveur.
- Les exports lourds se font par scripts, hors rendu web.
- Eviter d'ajouter des `include` Prisma larges sur les routes publiques.

## Environnements

Prevoir au minimum:

- local: `.env` local, PostgreSQL local ou Docker.
- staging: base separee, admin separe, donnees de test.
- production: base separee, backups planifies, secrets stockes dans le gestionnaire du VPS.

Variables critiques:

- `DATABASE_URL`
- `ADMIN_EMAIL`
- `ADMIN_NAME`
- `ADMIN_PASSWORD_HASH`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_WHATSAPP_NUMBER`
- `BACKUP_DIR`
- `EXPORT_DIR`
- `PG_BIN` si PostgreSQL n'est pas dans le `PATH`

## Deploiement VPS

Avant release:

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npx.cmd prisma validate
npx.cmd prisma generate
npm.cmd run prisma:counts
```

Sur serveur:

```bash
npm ci
npx prisma migrate deploy
npm run build
npm run start
```

Ne pas lancer `prisma db seed` en production sans decision explicite. Le seed sert surtout a initialiser local/staging.

## Observability

- `AdminLog` est la source applicative pour les actions admin sensibles.
- Les erreurs API publiques renvoient des messages generiques en francais.
- Pour Sentry ou equivalent, connecter les error boundaries et les catch API sans envoyer secrets, tokens ou payloads complets.

## Definition of done production

- Build OK.
- DB migration OK.
- Backup teste.
- Restore teste sur staging.
- Scan public sans fuite connue.
- Admin login/logout OK.
- RBAC verifie avec au moins un role sensible non SUPER_ADMIN.
- Aucun moyen de paiement Visa/CMI/Mastercard affiche comme actif.
