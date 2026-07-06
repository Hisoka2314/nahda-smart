# Security checklist Nahda Smart

## Auth admin

- [x] Aucun mot de passe admin en clair.
- [x] Aucun admin cree si le hash est absent ou placeholder.
- [x] Sessions admin via cookie `HttpOnly`.
- [x] Token de session non stocke en clair en DB.
- [x] `Secure` active automatiquement en production.
- [x] Headers securite globaux ajoutes via `next.config.ts`.
- [x] Cache admin/API force en `no-store`.
- [x] Controle same-origin sur API publiques sensibles.
- [x] Roles exacts : `SUPER_ADMIN`, `MANAGER`, `SELLER`, `STOCK_MANAGER`, `ACCOUNTANT`, `DELIVERY`.
- [x] Verification serveur avec `requireAdmin`, `requireRole`, `requireAdminSection`.
- [x] Rate limit login en memoire pour dev.
- [x] Rate limit API publiques sensibles en memoire.
- [x] Logs admin sans secrets.
- [x] Error boundary sans stacktrace client.
- [x] Script de scan public anti-fuite.

## A faire avant production

- Remplacer le rate limit memoire par un stockage partage.
- Ajouter rotation/revocation de toutes les sessions d'un admin depuis le dashboard.
- Ajouter double facteur si le contexte client le demande.
- Ajouter audit IP/user-agent plus detaille.
- Ajouter alerting sur tentatives repetitives.
- Ajouter tests automatises Playwright pour login/logout/RBAC.
- Verifier les headers securite sur le domaine final avec HTTPS.
- Tester restore backup sur staging avant production.

## Regles permanentes

- Ne jamais utiliser localStorage pour une session admin.
- Ne jamais exposer un token admin au client.
- Ne jamais verifier les roles uniquement cote UI.
- Ne jamais afficher une stacktrace auth au client.
- Ne jamais activer Visa, CMI ou Mastercard tant que le paiement en ligne n'est pas decide.
