// Caracteristiques relevees a la main sur les fiches constructeur et
// revendeur, pour les produits qu'Icecat ne couvre pas.
//
// Utilisation :
//   node scripts/completer-fiches-recherchees.mjs
//
// Regle suivie pour le materiel d'occasion : la configuration (memoire,
// stockage) vient de la designation du magasin, qui seul connait la machine
// vendue. Le chassis (ecran, connectique, poids) vient du constructeur : il
// est constant pour le modele, et donc verifiable.
//
// Le tableau ci-dessous s'etoffe au fil des recherches. Relancer le script
// reecrit le bloc "Caracteristiques" sans toucher aux groupes Icecat.

import { readFileSync } from "node:fs";
import pg from "pg";

const FICHES = {
  "LHO-840G6I78256": [
    ["Processeur", "Intel Core i7 de 8e génération"],
    ["Mémoire vive", "8 Go"],
    ["Stockage", "256 Go SSD"],
    ["Écran", "14 pouces, 1920 x 1080 (Full HD), dalle IPS"],
    ["Connectique", "2x USB 3.1 Gen 1, 1x Thunderbolt (USB Type-C), HDMI 1.4b, RJ-45"],
    ["Batterie", "50 Wh, 3 cellules lithium-ion"],
    ["Poids", "1,48 kg"],
  ],
  "LLO-L13I5108256": [
    ["Processeur", "Intel Core i5 de 10e génération"],
    ["Mémoire vive", "8 Go"],
    ["Stockage", "256 Go SSD"],
    ["Écran", "13,3 pouces, 1920 x 1080 (Full HD), dalle IPS antireflet"],
    ["Connectique", "2x USB Type-A, 2x USB Type-C (dont un Thunderbolt), HDMI"],
    ["Sans fil / réseau", "Wi-Fi 6, Bluetooth 5.1"],
    ["Poids", "1,39 kg pour 1,76 cm d'épaisseur"],
  ],
  "LHO-1040G7": [
    ["Processeur", "Intel Core i7 de 10e génération"],
    ["Mémoire vive", "16 Go"],
    ["Stockage", "512 Go SSD"],
    ["Écran", "14 pouces tactile, 1920 x 1080 (Full HD), dalle IPS, charnière 360°"],
    ["Connectique", "2x Thunderbolt 3, HDMI 1.4b, 2x USB 3.2 Gen 1 Type-A, jack 3,5 mm, emplacement nano-SIM"],
    ["Poids", "1,32 kg"],
  ],
  "IHN-137FNW": [
    ["Type", "Imprimante laser monochrome multifonction : impression, copie, numérisation, fax"],
    ["Vitesse d'impression", "Jusqu'à 20 pages par minute en A4"],
    ["Résolution", "1200 x 1200 ppp en impression, 600 x 600 ppp en numérisation"],
    ["Chargeur de documents", "Automatique, 40 pages"],
    ["Fax", "Résolution jusqu'à 300 x 300 ppp"],
    ["Sans fil / réseau", "Wi-Fi 802.11 b/g/n, Ethernet"],
    ["Volume mensuel", "Jusqu'à 10 000 pages"],
  ],
  "ALO-TIO22": [
    ["Type", "Écran 21,5 pouces recevant un module Tiny à l'arrière : l'ordinateur se loge dans l'écran"],
    ["Processeur", "Intel Core i5 de 8e génération"],
    ["Mémoire vive", "8 Go"],
    ["Stockage", "256 Go SSD"],
    ["Écran", "21,5 pouces, 1920 x 1080 (Full HD), dalle IPS, 250 cd/m², contraste 1000:1, angles 178°"],
    ["Connectique", "DisplayPort, 1x USB 3.1 Gen 1, entrée microphone"],
    ["Pied", "Inclinaison -5° à +30°, pivot 45° de chaque côté, réglage en hauteur sur 150 mm, rotation en portrait"],
  ],
  VGA1030: [
    ["Processeur graphique", "NVIDIA GeForce GT 1030, 384 cœurs CUDA"],
    ["Mémoire", "2 Go GDDR5, interface 64 bits, 6008 MHz"],
    ["Fréquences", "1252 MHz de base, 1506 MHz en Boost (1278 / 1531 MHz en mode OC)"],
    ["Connectique", "1x HDMI 2.0b, 1x DVI-D single link"],
    ["Interface", "PCI Express 3.0"],
    ["Définition maximale", "4096 x 2160"],
    ["Alimentation", "30 W ; bloc de 300 W recommandé"],
    ["Compatibilité", "OpenGL 4.5, HDCP 2.2"],
  ],
  VGMSI1030: [
    ["Processeur graphique", "NVIDIA GeForce GT 1030, 384 cœurs CUDA"],
    ["Mémoire", "2 Go GDDR5, interface 64 bits"],
    ["Interface", "PCI Express 3.0"],
    ["Définition maximale", "4096 x 2160"],
    ["Alimentation", "30 W ; bloc de 300 W recommandé"],
    ["Format", "Aero ITX, format court pour boîtier compact"],
  ],
  "LHO-X360-830G7": [
    ["Processeur", "Intel Core i5 de 10e génération, 4 cœurs"],
    ["Mémoire vive", "16 Go DDR4-2666"],
    ["Stockage", "256 Go SSD"],
    ["Écran", "13,3 pouces tactile, 1920 x 1080 (Full HD), dalle IPS, charnière 360°"],
    ["Connectique", "2x USB-C, HDMI"],
    ["Poids", "1,31 kg"],
  ],
  "LHO-1030G4I58256X": [
    ["Processeur", "Intel Core i5 de 8e génération"],
    ["Mémoire vive", "8 Go"],
    ["Stockage", "256 Go SSD"],
    ["Écran", "13,3 pouces tactile, 1920 x 1080 (Full HD), dalle IPS, charnière 360°"],
    ["Carte graphique", "Intel UHD Graphics 620 intégrée"],
    ["Connectique", "2x USB-C 3.2 Gen 1 avec Thunderbolt 3, 1x USB-A 3.2 Gen 1, HDMI 1.4, jack casque-micro"],
    ["Sans fil / réseau", "Wi-Fi 6 (802.11ax), Bluetooth 5.0"],
    ["Batterie", "56,2 Wh, 4 cellules"],
    ["Poids", "1,27 kg"],
  ],
  "LLO-L390G8": [
    ["Processeur", "Intel Core i5 de 8e génération"],
    ["Mémoire vive", "16 Go"],
    ["Stockage", "256 Go SSD"],
    ["Écran", "13,3 pouces, 1920 x 1080 (Full HD), dalle IPS"],
    ["Connectique", "2x USB 3.1 Gen 1 dont un toujours alimenté, 2x USB-C 3.1 Gen 1 (charge, DisplayPort, données), HDMI 1.4, lecteur microSD, mini RJ-45 gigabit, jack casque-micro"],
    ["Batterie", "45 Wh lithium-polymère, charge rapide à 80 % en une heure avec l'adaptateur 65 W"],
    ["Poids", "1,46 kg"],
  ],
  "DS-7608NI-K1/8P": [
    ["Type", "Enregistreur réseau 8 voies avec injection PoE intégrée"],
    ["Voies", "8 caméras IP, alimentées par les 8 ports PoE : un seul câble par caméra"],
    ["Définitions acceptées", "Jusqu'à 8 MP, ainsi que 6, 5, 4, 3 MP, 1080p, UXGA, 720p et VGA"],
    ["Compression", "H.265+, H.265, H.264+, H.264"],
    ["Sorties vidéo", "HDMI et VGA, jusqu'à 4K 3840 x 2160 à 30 Hz"],
    ["Bande passante", "80 Mbit/s en entrée comme en sortie"],
    ["Stockage", "1 disque SATA jusqu'à 6 To (non inclus)"],
    ["Connectique", "1x RJ45 réseau, 8x RJ45 PoE"],
  ],
  "LHO-830G8I716256X": [
    ["Processeur", "Intel Core i7 de 11e génération, architecture Tiger Lake"],
    ["Mémoire vive", "16 Go"],
    ["Stockage", "256 Go SSD"],
    ["Écran", "13,3 pouces tactile, charnière 360° pour usage en tablette"],
    ["Connectique", "2x Thunderbolt 4 USB-C à 40 Gbit/s, 2x USB-A 5 Gbit/s dont un pour la charge, HDMI 2.0, jack casque-micro"],
    ["Batterie", "53 Wh, 3 cellules lithium-polymère, charge rapide par USB-C 65 W"],
    ["Poids", "1,26 kg"],
  ],
  "LHO-15G5I732256": [
    ["Type", "Station de travail mobile"],
    ["Processeur", "Intel Core i7 de 8e génération"],
    ["Mémoire vive", "32 Go"],
    ["Stockage", "512 Go SSD"],
    ["Écran", "15,6 pouces, 1920 x 1080 (Full HD), dalle IPS antireflet"],
    ["Carte graphique", "NVIDIA Quadro, certifiée pour la modélisation 3D, le rendu et le montage vidéo"],
    ["Connectique", "HDMI 2.0, 2x USB-C Thunderbolt 3 avec DisplayPort 1.3, 1x USB 3.0, jack casque-micro"],
    ["Poids", "2,6 kg"],
  ],
  "DS-3E0524R-O": [
    ["Type", "Commutateur réseau non administrable"],
    ["Ports", "24 ports Ethernet 10/100/1000 Mbit/s, commutation à débit de ligne"],
    ["Installation", "Aucune configuration : se branche et fonctionne"],
    ["Usage", "Bureaux, écoles, résidences et petites installations"],
  ],
  "DH-HAC-HFW1220BP": [
    ["Type", "Caméra tube HDCVI, série Lite"],
    ["Capteur", "CMOS 1/2,7 pouce, 2 mégapixels"],
    ["Définition", "1080p à 25 ou 30 images par seconde"],
    ["Objectif", "3,6 mm fixe (6 mm et 8 mm disponibles)"],
    ["Éclairage", "Infrarouge intelligent jusqu'à 50 m"],
    ["Traitement d'image", "Filtre jour-nuit mécanique (ICR), balance des blancs et gain automatiques, compensation de contre-jour, réduction de bruit 2D"],
    ["Alimentation", "12 V continu"],
    ["Protection", "IP67 contre la poussière et l'eau"],
  ],
  "DS-2CE16K0T-EXLF": [
    ["Type", "Caméra tube analogique, série ColorVu à éclairage hybride"],
    ["Définition", "3K, 2960 x 1665 pixels, capteur CMOS"],
    ["Objectif", "2,8 mm ou 3,6 mm à focale fixe"],
    ["Éclairage", "Hybride intelligent : infrarouge jusqu'à 20 m, lumière blanche jusqu'à 20 m"],
    ["Sensibilité", "0,02 lux à F2.2 avec AGC actif, 0 lux avec l'infrarouge"],
    ["Signaux", "TVI 3K à 20 i/s, 4 MP et 1080p à 25 ou 30 i/s"],
    ["Protection", "IP67 contre la poussière et l'eau"],
    ["Alimentation", "5 W maximum"],
    ["Température de service", "-40 °C à +60 °C"],
  ],
  "DS-2CE76D0T-EXIMF": [
    ["Type", "Caméra dôme analogique"],
    ["Définition", "2 MP, 1920 x 1080, capteur CMOS"],
    ["Objectif", "2,8 mm : champ horizontal 96,5°, vertical 48,9°, diagonal 120,5°. 3,6 mm : 76,9°, 40,6°, 92°"],
    ["Éclairage", "Infrarouge jusqu'à 20 m, filtre de coupure automatique jour et nuit"],
    ["Sensibilité", "0,02 lux à F1.2 avec AGC actif, 0 lux avec l'infrarouge"],
    ["Protection", "IP67 contre la poussière et l'eau"],
  ],
  "STN-LS1008": [
    ["Type", "Commutateur réseau non administrable, format bureau"],
    ["Ports", "8 ports RJ45 à 10/100 Mbit/s, auto-négociation et auto-MDI/MDIX"],
    ["Installation", "Aucune configuration : se branche et fonctionne"],
    ["Refroidissement", "Sans ventilateur, donc silencieux"],
    ["Économie d'énergie", "Technologie Green Ethernet"],
    ["Contrôle de flux", "IEEE 802.3x"],
    ["Boîtier", "Plastique"],
  ],
  CE103O: [
    ["Type", "Bouteille d'encre d'origine Epson 103, noir"],
    ["Contenance", "65 ml"],
    ["Rendement", "Environ 4 500 pages"],
    ["Imprimantes compatibles", "EcoTank L1110, L1210, L1250, L3110, L3111, L3150, L3151, L3156, L3210, L3250, L3251, L3260, L5190, L5290"],
  ],
  "CEN-103C": [
    ["Type", "Bouteille d'encre d'origine Epson 103, cyan"],
    ["Contenance", "65 ml"],
    ["Rendement", "Environ 7 500 pages"],
    ["Imprimantes compatibles", "EcoTank L1110, L1210, L1250, L3110, L3111, L3150, L3151, L3156, L3210, L3250, L3251, L3260, L5190, L5290"],
  ],
  "CEN-103M": [
    ["Type", "Bouteille d'encre d'origine Epson 103, magenta"],
    ["Contenance", "65 ml"],
    ["Rendement", "Environ 7 500 pages"],
    ["Imprimantes compatibles", "EcoTank L1110, L1210, L1250, L3110, L3111, L3150, L3151, L3156, L3210, L3250, L3251, L3260, L5190, L5290"],
  ],
  "DS-2CE76K0T-EXLMF": [
    ["Type", "Caméra dôme analogique, série ColorVu à double éclairage"],
    ["Définition", "3K, 2960 x 1665 pixels"],
    ["Objectif", "2,8 mm : champ horizontal 101°, vertical 64°, diagonal 125°. 3,6 mm : 80°, 51°, 98°"],
    ["Éclairage", "Double : infrarouge intelligent jusqu'à 30 m, lumière blanche jusqu'à 20 m"],
    ["Signaux", "TVI 3K à 20 i/s, 4 MP et 1080p à 25 ou 30 i/s ; AHD 5 MP à 20 i/s ; CVI 4 MP"],
    ["Alimentation", "12 V continu ±25 %, 4,1 W maximum"],
    ["Température de service", "-40 °C à +60 °C"],
  ],
  "DS-2CD1123G0E-I": [
    ["Type", "Caméra dôme réseau à objectif fixe"],
    ["Définition", "2 MP, 1920 x 1080"],
    ["Objectif", "2,8 mm ou 4 mm selon la version"],
    ["Éclairage", "Infrarouge jusqu'à 30 m"],
    ["Compression", "H.265+, H.265, H.264+, H.264"],
    ["Alimentation", "PoE 802.3af classe 3, 36 à 57 V, 6,5 W maximum"],
    ["Traitement d'image", "Réduction de bruit 3D (3D DNR), plage dynamique étendue (DWDR), compensation de contre-jour (BLC)"],
    ["Protection", "IP67 contre la poussière et l'eau, IK10 contre le vandalisme"],
  ],
  "IDS-7208HQHI-M1/E": [
    ["Type", "Enregistreur numérique 8 voies, série AcuSense"],
    ["Voies", "8 entrées acceptant HDTVI, AHD, CVI, CVBS et IP"],
    ["Compression", "H.265 Pro+"],
    ["Sorties vidéo", "1x HDMI et 1x VGA simultanées, jusqu'à 1920 x 1080 à 60 Hz"],
    ["Stockage", "1 disque, jusqu'à 10 To (non inclus)"],
    ["Connectique", "1x RJ45 10/100 Mbit/s, 2x USB 2.0, RS-485 semi-duplex"],
    ["Analyse", "Classification personne / véhicule par apprentissage profond, pour réduire les fausses alertes"],
    ["Format", "Boîtier 1U"],
  ],
  "BHN-SS03XL": [
    ["Type", "Batterie de remplacement HP SS03XL"],
    ["Capacité", "50 Wh, 4330 mAh"],
    ["Tension", "11,55 V"],
    ["Technologie", "Lithium-ion, 3 cellules"],
    ["Modèles compatibles", "HP EliteBook 730, 735, 740, 745, 830, 836, 840, 846 en G5 et G6 ; ZBook 14u G5 et G6"],
    ["Références équivalentes", "SS03050XL, HSTNN-LB8G, 932823-1C1, 933321-855, HSN-112C, HSN-I13C-4"],
  ],
  "IDS-7204HQHI-M1/T": [
    ["Type", "Enregistreur numérique 4 voies, série AcuSense"],
    ["Voies", "4 caméras analogiques"],
    ["Compression", "H.265 Pro+, H.265 Pro, H.265, H.264+, H.264"],
    ["Sorties vidéo", "1x HDMI, 1x VGA, 1x BNC"],
    ["Stockage", "1 emplacement SATA, jusqu'à 10 To (disque non inclus)"],
    ["Analyse", "Détection de mouvement par apprentissage profond, distinction personne / véhicule"],
    ["Format", "Boîtier 1U"],
  ],
  "IEN-L3250": [
    ["Type", "Imprimante jet d'encre couleur multifonction à réservoirs rechargeables : impression, copie, numérisation"],
    ["Vitesse d'impression", "33 pages/min en noir et 15 en couleur ; 10 et 5 pages/min en norme ISO"],
    ["Résolution", "5760 x 1440 ppp en impression, 1200 x 2400 ppp en numérisation"],
    ["Encre", "4 réservoirs séparés (noir, cyan, magenta, jaune)"],
    ["Autonomie", "Jusqu'à 8 100 pages en noir et 6 500 en couleur avec l'encre fournie"],
    ["Sans fil / réseau", "Wi-Fi, Wi-Fi Direct, USB"],
    ["Bac papier", "100 feuilles"],
  ],
  "LHN-RV9": [
    ["Type", "Lecteur de codes-barres sans fil, 1D et 2D"],
    ["Codes lus", "1D (UPC, EAN) et 2D (QR Code, Data Matrix)"],
    ["Capteur", "CMOS 1 mégapixel, 1280 x 800, 60 images par seconde"],
    ["Sans fil / réseau", "Bluetooth jusqu'à 20 m, radio 2,4 GHz de 50 à 100 m"],
    ["Batterie", "Lithium amovible 600 mAh"],
  ],
  "PHN-300G3C30836": [
    ["Processeur", "Intel Core i3-8100, 4 cœurs, 3,6 GHz, 6 Mo de cache"],
    ["Carte graphique", "Intel UHD Graphics 630 intégrée"],
    ["Mémoire vive", "4 Go installés, extensible à 16 Go DDR4-2666"],
    ["Stockage", "1 To"],
    ["Chipset", "Intel B365"],
    ["Connectique", "HDMI, VGA"],
    ["Format", "Micro-tour"],
  ],
};

const url = readFileSync(".env", "utf8").match(/DATABASE_URL="([^"]+)"/)[1];
const c = new pg.Client({ connectionString: url });
await c.connect();

let ecrits = 0;
for (const [sku, lignes] of Object.entries(FICHES)) {
  const { rows } = await c.query(`SELECT id, name, "technicalDescription" FROM "Product" WHERE sku = $1`, [sku]);

  if (rows.length === 0) { console.log(`  introuvable : ${sku}`); continue; }

  let groupes = [];
  try {
    const existant = JSON.parse(rows[0].technicalDescription ?? "[]");
    if (Array.isArray(existant)) groupes = existant.filter((g) => g?.groupe !== "Caractéristiques");
  } catch { groupes = []; }

  groupes.unshift({ groupe: "Caractéristiques", lignes });

  await c.query(`UPDATE "Product" SET "technicalDescription" = $2, "updatedAt" = NOW() WHERE id = $1`,
    [rows[0].id, JSON.stringify(groupes)]);

  ecrits += 1;
  console.log(`  ${sku.padEnd(18)} ${lignes.length} caracteristiques  ${rows[0].name.slice(0, 44)}`);
}

console.log(`\nfiches ecrites : ${ecrits}`);
await c.end();
