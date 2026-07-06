# Image Prompts Nahda Smart

## Hero Tech Premium

Mode utilisé : ImageGen intégré.

Prompt :

```text
Premium Moroccan tech ecommerce hero background showing generic business technology products: laptop, Wi-Fi router, security camera, network switch, printer silhouette, and office telecom phone arranged on a dark glossy surface with olive-green digital light trails. Wide 16:9, dark negative space on the left for headline text, high-end realistic product mockup, cinematic studio lighting, deep black, white highlights, olive tech green accents, no real logos, no readable text, no watermark, no payment logos, no certifications, no people.
```

Fichier projet :

```text
public/generated/hero-tech-premium.png
```

Source générée conservée par Codex :

```text
C:\Users\hp\.codex\generated_images\019edd18-a668-77f0-919f-ba93361eb774\ig_0c60b1d0a187c701016a34847dd2f081918229ab849624f481.png
```

## Placeholders Catégories Et Produits

Les fichiers SVG dans `public/generated/` sont des placeholders propres et remplaçables. Ils ne contiennent aucun logo réel et doivent être remplacés plus tard par des photos fournisseurs ou des rendus produit autorisés.

Ajouts Phase 2 :

```text
public/generated/category-rack.svg
public/generated/product-ssd.svg
public/generated/promo-offer.svg
```

Prompts recommandés pour remplacer ces placeholders plus tard :

```text
Baie réseau : photo produit générique d’une baie réseau 18U noire, portes vitrées, câblage propre, fond blanc premium, aucune marque visible, aucun texte.
SSD NVMe : photo produit générique d’un SSD NVMe noir et vert olive sur fond blanc, éclairage studio, aucune marque visible, aucun texte.
Bannière promo : composition dark tech premium avec badge pourcentage 3D, glow vert olive, espace texte à gauche, aucun logo, aucune certification, aucun moyen de paiement.
```

## Phase 2.1 - Product Shots Et Logos

Les visuels produits suivants sont des mockups PNG locaux, plus proches d'une fiche e-commerce que les anciens pictogrammes. Ils restent generiques et remplacables par des photos fournisseurs autorisees.

```text
public/generated/product-laptop-real.png
public/generated/product-router-real.png
public/generated/product-switch-real.png
public/generated/product-camera-real.png
public/generated/product-printer-real.png
public/generated/product-ssd-real.png
public/generated/product-accessory-real.png
public/generated/product-phone-ip-real.png
public/generated/product-rack-real.png
public/generated/product-ups-real.png
public/generated/product-gaming-real.png
public/generated/product-software-real.png
```

Prompts recommandes pour remplacement photo-realiste :

```text
PC portable professionnel generique sur fond blanc premium, angle trois-quarts, ecran allume avec glow vert olive abstrait, aucun logo, aucun texte lisible, eclairage studio ecommerce.
Routeur Wi-Fi 6 generique noir avec antennes, fond blanc premium, details ports et LED, rendu photo-realiste, aucun logo, aucun texte.
Switch reseau rackable 24 ports generique, noir mat, ports Ethernet visibles, fond blanc studio, aucun logo, aucun texte.
Camera IP dome generique blanche, objectif detaille, fond blanc premium, eclairage doux, aucun logo, aucun texte.
Imprimante laser multifonction generique blanche, angle trois-quarts, fond blanc ecommerce, aucun logo, aucun texte.
SSD NVMe generique noir avec puces visibles, accents vert olive, fond blanc premium, aucun logo, aucun texte.
Telephone IP generique noir, ecran allume abstrait vert olive, touches visibles, fond blanc studio, aucun logo, aucun texte.
Baie reseau generique noire avec porte vitree, panneaux de brassage et cables propres, fond blanc premium, aucun logo, aucun texte.
Onduleur UPS generique noir, face avant detaillee, fond blanc ecommerce, aucun logo, aucun texte.
```

Logos marques :

```text
public/brands/*.svg
```

Ces SVG sont des wordmarks temporaires locaux, pas des assets officiels. Ils ne sont plus affiches dans l'interface tant qu'un logo officiel ou fournisseur autorise n'est pas renseigne dans `data/brands.ts`.

## Phase 2.2 - Images IA Produits Et Fallback Marques

Mode utilise : ImageGen integre, puis copie locale des PNG generes dans `public/generated/`.

Fichiers produits generes :

```text
public/generated/product-laptop-ai.png
public/generated/product-desktop-ai.png
public/generated/product-aio-ai.png
public/generated/product-software-ai.png
public/generated/product-router-ai.png
public/generated/product-switch-ai.png
public/generated/product-camera-ai.png
public/generated/product-printer-ai.png
public/generated/product-ssd-ai.png
public/generated/product-headset-ai.png
public/generated/product-ip-phone-ai.png
public/generated/product-rack-ai.png
public/generated/product-ups-ai.png
public/generated/product-accessories-ai.png
```

Prompt source commun :

```text
Use case: product-mockup
Asset type: ecommerce product photo placeholder for a French Moroccan tech store
Scene/backdrop: clean premium ecommerce studio background, off-white surface with a very subtle olive green tech glow, soft shadow under product
Style/medium: photorealistic product photography, sharp catalog image
Composition/framing: centered product, 4:3 landscape framing, generous padding, product fully visible
Lighting/mood: soft studio lighting, premium tech retail, crisp edges
Color palette: black, graphite, white, subtle olive green accent
Constraints: no brand logos, no fake certifications, no readable text, no watermark
```

Sujets utilises par fichier :

```text
product-laptop-ai.png: modern black and graphite business laptop, keyboard visible, no logos.
product-desktop-ai.png: black business desktop tower next to slim monitor and compact keyboard, no logos.
product-aio-ai.png: slim black and graphite all-in-one computer with keyboard and mouse, no logos.
product-software-ai.png: abstract business software license visual with dark activation card and secure cloud dashboard, no readable words.
product-router-ai.png: black modern Wi-Fi router with four antennas and front LED lights, no logos.
product-switch-ai.png: black 24-port rackmount Gigabit network switch with visible Ethernet ports and status LEDs, no logos.
product-camera-ai.png: white dome IP security camera with black lens and wall mount, no logos.
product-printer-ai.png: white and graphite office laser multifunction printer, no logos.
product-ssd-ai.png: M.2 NVMe SSD module, black PCB, chips and gold connector, no logos.
product-headset-ai.png: black over-ear business headset with microphone boom, no logos.
product-ip-phone-ai.png: black professional VoIP desk phone with handset and keypad, no logos.
product-rack-ai.png: black 18U network rack cabinet with glass front door and cable management, no logos.
product-ups-ai.png: black compact UPS tower with front display and ventilation, no logos.
product-accessories-ai.png: keyboard, mouse, USB-C hub, ethernet cable and adapter arranged for ecommerce, no logos.
```

Strategie marques Phase 2.2 :

```text
public/brands/ est conserve comme dossier cible pour les futurs vrais logos.
data/brands.ts expose des marques admin-ready avec name, slug, logoPath optionnel, fallbackLabel, isActive, isOfficialAsset, allowAdminUpload, sortOrder et updatedAt.
Si logoPath est absent ou non officiel, l'UI affiche un fallback typographique propre via BrandMark au lieu d'un faux logo.
Pour activer un vrai logo plus tard : ajouter le fichier autorise dans public/brands/, renseigner logoPath et passer isOfficialAsset a true.
```
