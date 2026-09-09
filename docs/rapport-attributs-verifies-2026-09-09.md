# Rapport du lot vérifié du 9 septembre 2026

Le registre `data/verified-product-specs.json` couvre 17 références et 133
valeurs. Chaque valeur possède deux sources HTTPS, un extrait de preuve, une
date de contrôle et le périmètre de la configuration concernée.

Références traitées :

- Lenovo ThinkPad L13 Gen 1 et ThinkPad L390 ;
- HP EliteBook x360 1030 G3/G4, x360 830 G7, 830 G8, 840 G6, x360 1040 G7,
  ProBook 450 G5 et ZBook 15 G5 ;
- Hikvision DS-2CE16K0T-EXLF, DS-2CE76D0T-EXIMF, DS-2CD1123G0E-I,
  DS-7616NI-K2 et IDS-7208HQHI-M1/T ;
- Dahua DH-HAC-HFW1220BP ;
- Epson EcoTank L3250.

Les valeurs dépendant d'une variante non identifiée (GPU dédié, résolution ou
dalle différente) sont volontairement absentes. Les poids sont utilisés
uniquement sous forme de plage lorsque la configuration est identifiée. La
portée de la DS-2CE16K0T-EXLF est publiée à 20 m alors que le filtre proposait
30 m ; elle n'a donc pas été forcée dans ce filtre.

Les poids des dix configurations de PC portables sont classés dans les plages
du filtre (`Moins de 1.5 kg` ou `Plus de 2 kg`) à partir de deux fiches
concordantes par référence.

## Vérification locale

Après écriture dans la base locale, une seconde simulation a retourné :

```text
proposed: 0
identique: 133
```

Cela confirme que l'import est idempotent. Avant le nettoyage, les valeurs
historiques issues de l'ancien extracteur étaient signalées comme non vérifiées
et n'étaient jamais présentées comme preuves du registre.

Le mode `--apply --purge-unverified` a ensuite été exécuté sur la base locale
de test : 204 lignes historiques ont été supprimées après sauvegarde et
conservées dans le rapport d'audit. Une simulation post-nettoyage retourne
`nonVerified: 0`, `identique: 133` et `proposed: 0`.
