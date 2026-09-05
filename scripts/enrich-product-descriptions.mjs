// Redaction des fiches produit importees depuis l'inventaire.
//
// Utilisation :
//   node scripts/enrich-product-descriptions.mjs [--apply] [--tout]
//
// Sans --apply, le script se contente d'un rapport : aucune ecriture.
//
// L'import d'inventaire recopie la designation brute du magasin dans la
// description : "GLASS TEL SAMSUNG NOTE 4". C'est illisible en boutique et
// sans valeur pour le referencement. Ce script en tire une fiche presentable.
//
// Principe directeur : ne rien inventer. Tout ce qui est ecrit provient soit
// de la base (marque, categorie, garantie), soit de caracteristiques lues
// dans la designation elle-meme. Aucune promesse commerciale, aucune
// specification supposee : un client qui compare deux fiches doit pouvoir se
// fier a ce qu'il lit.
//
// Par defaut seules les fiches encore brutes sont traitees (description egale
// a la designation en majuscules). --tout force la reecriture de toutes les
// fiches issues de l'inventaire.

import { readFileSync } from "node:fs";
import pg from "pg";

const flags = process.argv.slice(2);
const apply = flags.includes("--apply");
const tout = flags.includes("--tout");

const databaseUrl =
  process.env.DATABASE_URL ??
  readFileSync(".env", "utf8").match(/DATABASE_URL="([^"]+)"/)?.[1];

if (!databaseUrl) {
  console.error("DATABASE_URL manquant.");
  process.exit(1);
}

// Nom de categorie utilise dans la phrase d'accroche. Le libelle affiche
// ("Peripheriques") ne se glisse pas dans une phrase, il faut un nom commun.
const NOM_CATEGORIE = {
  "pc-portables": "PC portable",
  "pc-bureau": "matériel bureautique",
  "all-in-one": "ordinateur tout-en-un",
  logiciels: "licence logicielle",
  impression: "consommable et matériel d'impression",
  "reseaux-connectivite": "équipement réseau",
  multimedia: "produit multimédia",
  peripheriques: "périphérique informatique",
  "securite-cameras": "équipement de vidéosurveillance",
  accessoires: "accessoire informatique",
  telephonie: "produit de téléphonie",
  stockage: "solution de stockage",
  "onduleurs-energie": "équipement d'alimentation",
  "baies-reseau-cablage": "élément de câblage réseau",
};

// Mentions de gestion accolees a la designation : elles servent au magasin
// ("*******exclu*******" signale un article exclu d'une operation) et n'ont
// aucun sens pour un client. Retirer les asterisques ne suffisait pas : le mot
// restait, et "Point Acces Tenda F3 Wireless N300 exclu" s'affichait tel quel
// en boutique.
const MENTIONS_INTERNES =
  /(?:^|\s)(?:exclu(?:sion|sivite)?|hors\s*promo|ne\s*pas\s*vendre|reserve|bloque|a\s*verifier|dispo\s*\?)\s*$/i;

function nettoyerNom(nom) {
  let propre = nom
    .replace(/\*+/g, " ")
    .replace(/[_]{2,}/g, " ")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.;:])/g, "$1")
    .trim();

  // En boucle : "... exclu exclu" apparait sur quelques designations.
  while (MENTIONS_INTERNES.test(propre)) {
    propre = propre.replace(MENTIONS_INTERNES, "").trim();
  }

  return propre.replace(/[-–/,;]+$/, "").trim();
}

function extraireSpecs(texte) {
  const t = texte.toUpperCase().replace(/,(\d)/g, ".$1");
  const specs = [];
  const vu = new Set();

  const ajouter = (valeur) => {
    if (valeur && !vu.has(valeur)) {
      vu.add(valeur);
      specs.push(valeur);
    }
  };

  // "I7" seul ne suffit pas : "Pochette iPhone 7G/I7" designe un modele de
  // telephone, pas un processeur. On exige donc soit le mot CORE, soit un
  // numero de modele accole (I7-8550U), soit la mention d'une generation.
  const processeur = /\bCORE\b|\bI[3579]-|\bI[3579]\s?\d{4,5}[A-Z]{0,2}\b|\bI[3579]\b(?=.*\bEME\b)/.test(t)
    ? t.match(/\bI([3579])\b[- ]?(\d{4,5}[A-Z]{0,2})?/)
    : null;
  if (processeur) {
    ajouter(`Processeur Intel Core i${processeur[1]}${processeur[2] ? ` ${processeur[2]}` : ""}`);
  } else if (/\bCELERON\b/.test(t)) ajouter("Processeur Intel Celeron");
  else if (/\bPENTIUM\b/.test(t)) ajouter("Processeur Intel Pentium");
  else if (/\bRYZEN\s?([357９])?/.test(t)) {
    const r = t.match(/\bRYZEN\s?([357])?/);
    ajouter(`Processeur AMD Ryzen${r[1] ? ` ${r[1]}` : ""}`);
  }

  const generation = t.match(/\b(\d{1,2})\s?EME\b/);
  if (generation) ajouter(`${generation[1]}e génération`);

  const frequence = t.match(/(\d+(?:\.\d+)?)\s?GHZ\b/);
  if (frequence) ajouter(`Fréquence ${frequence[1]} GHz`);

  // Deux capacites separees par "/" : la premiere est la memoire vive, la
  // seconde le stockage. C'est la convention de saisie du magasin
  // ("8GO/256GO SSD") et elle est constante sur tout l'inventaire.
  const paire = t.match(/(\d+)\s?G[OB]\s?\/\s?(\d+)\s?(G[OB]|T[OB])/);
  if (paire) {
    ajouter(`${paire[1]} Go de mémoire vive`);
    ajouter(`Stockage ${paire[2]} ${paire[3].startsWith("T") ? "To" : "Go"}`);
  } else {
    // Le magasin abrege parfois l'unite : "256G SSD", "RAM 8G". Le G seul
    // n'est donc accepte qu'accole a SSD/HDD/NVME ou precede de RAM, sans quoi
    // "GT 1030" ou "4G" seraient lus comme des capacites.
    const memoireExplicite = t.match(/\bRAM\s?(\d+)\s?G[OB]?\b/);
    const memoire =
      memoireExplicite ?? t.match(/\b(\d+)\s?G[OB]\b(?!\s?(SSD|HDD|NVME))/);
    const disque = t.match(/\b(\d+)\s?(G[OB]?|T[OB]?)\s?(SSD|HDD|NVME)\b/);

    if (disque) ajouter(`Stockage ${disque[1]} ${disque[2].startsWith("T") ? "To" : "Go"} ${disque[3]}`);
    if (memoireExplicite) ajouter(`${memoireExplicite[1]} Go de mémoire vive`);
    else if (disque) {
      // La capacite est deja decrite par le disque : ne rien ajouter.
    } else if (memoire && /\bRAM\b|\bDDR\d?\b/.test(t)) ajouter(`${memoire[1]} Go de mémoire`);
    else if (memoire && /DISQUE|SSD|HDD|MICRO SD|CLE USB|FLASH/.test(t)) {
      ajouter(`Capacité ${memoire[1]} Go`);
    } else if (memoire) ajouter(`${memoire[1]} Go`);
  }

  const ddr = t.match(/\bDDR([2-5])\b/);
  if (ddr) ajouter(`Mémoire DDR${ddr[1]}`);

  // Un pouce n'est pas toujours une diagonale d'ecran : 2.5" et 3.5" designent
  // le format d'un disque, et un boitier de disque n'a pas d'ecran. En dessous
  // de dix pouces on parle donc de format, au-dessus d'ecran.
  const pouces = t.match(/(\d{1,2}(?:\.\d)?)\s?(?:"|POUCES?|''|”)/);
  if (pouces) {
    const valeur = Number(pouces[1]);
    // Un support d'ecran n'a pas d'ecran : la mesure annonce ce qu'il accepte.
    // "40"-80"" est une plage, on la restitue telle quelle.
    const support = /\bSUPPORT\b|\bBRAS\b|\bFIXATION\b|\bPIED\b/.test(t);
    const plage = t.match(/(\d{1,2})\s?(?:"|POUCES?)\s?[-–/]\s?(\d{1,2})\s?(?:"|POUCES?)/);

    if (support) {
      ajouter(
        plage
          ? `Compatible écrans ${plage[1]} à ${plage[2]} pouces`
          : `Compatible écrans ${pouces[1]} pouces`,
      );
    } else if (valeur >= 10) ajouter(`Écran ${pouces[1]} pouces`);
    else if (valeur > 0) ajouter(`Format ${pouces[1]} pouces`);
  }

  const definition = t.match(/\b(4K|2K|3K|UHD|FHD|QHD|FULL HD)\b/);
  if (definition) ajouter(`Définition ${definition[1].replace("FULL HD", "Full HD")}`);

  const rafraichissement = t.match(/(\d{2,3})\s?HZ\b/);
  if (rafraichissement) ajouter(`${rafraichissement[1]} Hz`);

  const megapixels = t.match(/\b(\d+(?:\.\d+)?)\s?MP\b/);
  if (megapixels) ajouter(`Capteur ${megapixels[1]} MP`);

  const debit = t.match(/\b(\d+)\s?(MBPS|MPS|GBPS)\b/);
  if (debit) ajouter(`Débit ${debit[1]} ${debit[2] === "GBPS" ? "Gbit/s" : "Mbit/s"}`);

  const ports = t.match(/\b(\d+)\s?PORTS?\b/);
  if (ports) ajouter(`${ports[1]} ports`);

  // Le M d'une reference constructeur n'est pas un metre : "OCD-114M" donnait
  // un cable de 114 metres. On exige donc que le nombre ne prolonge pas une
  // reference, et qu'il reste dans les longueurs qu'un magasin vend.
  const longueur = t.match(/(?<![A-Z0-9-])(\d+(?:\.\d+)?)\s?(?:M|METRES?)\b/);
  if (longueur && /CABLE|CORDON|RALLONGE|BOBINE/.test(t)) {
    const metres = Number(longueur[1]);
    if (metres > 0 && metres <= 305) ajouter(`Longueur ${longueur[1]} m`);
  }

  const batterie = t.match(/\b(\d{3,6})\s?MAH\b/);
  if (batterie) ajouter(`Batterie ${batterie[1]} mAh`);

  const puissance = t.match(/\b(\d+)\s?W\b/);
  if (puissance) ajouter(`Puissance ${puissance[1]} W`);

  // "DDR4 2666V" annonce une frequence, pas 2666 volts. Le materiel du magasin
  // va de la pile 1,5 V a l'onduleur 240 V : au-dela, ce n'est pas une tension.
  const tension = t.match(/\b(\d+(?:[.,]\d+)?)\s?V\b(?!GA)/);
  if (tension) {
    const volts = Number(tension[1].replace(",", "."));
    if (volts > 0 && volts <= 250) ajouter(`Tension ${tension[1].replace(",", ".")} V`);
  }

  const categorieCable = t.match(/\bCAT\s?([56]E?)\b|\bCATEGORIE\s?([56])\b/);
  if (categorieCable) ajouter(`Catégorie ${(categorieCable[1] ?? categorieCable[2]).toUpperCase()}`);

  // Connectique : c'est la premiere chose qu'un acheteur verifie sur un ecran,
  // un adaptateur ou une carte mere. On la regroupe en une seule ligne plutot
  // que d'aligner cinq etiquettes separees.
  const CONNECTEURS = [
    [/\bHDMI\b/, "HDMI"],
    [/\bMINI[- ]?HDMI\b/, "Mini-HDMI"],
    [/\bVGA\b/, "VGA"],
    [/\bDVI\b/, "DVI"],
    [/\bDISPLAY\s?PORT\b|\bDP\b/, "DisplayPort"],
    [/\bTYPE[- ]?C\b|\bTYP[- ]?C\b|\bUSB[- ]?C\b/, "USB-C"],
    [/\bUSB\s?3\.[01]\b/, "USB 3.0"],
    [/\bUSB\s?2\.0\b/, "USB 2.0"],
    [/\bUSB\b/, "USB"],
    [/\bRJ45\b/, "RJ45"],
    [/\bRJ11\b/, "RJ11"],
    [/\bBNC\b/, "BNC"],
    [/\bJACK\b|\bAUX\b|\b3\.5\s?MM\b/, "Jack 3,5 mm"],
    [/\bRCA\b/, "RCA"],
    [/\bTHUNDERBOLT\b/, "Thunderbolt"],
    [/\bSATA\b/, "SATA"],
    [/\bNVME\b|\bM\.?2\b/, "M.2 NVMe"],
    [/\bMICRO\s?SD\b/, "microSD"],
    [/\bSD\b(?!\s?CARD READER)/, "SD"],
    [/\bOTG\b/, "OTG"],
    [/\bPS\/?2\b/, "PS/2"],
    [/\bLIGHTNING\b/, "Lightning"],
    [/\bMICRO[- ]?USB\b/, "micro-USB"],
  ];

  const connectique = [];
  for (const [motif, libelle] of CONNECTEURS) {
    if (motif.test(t) && !connectique.includes(libelle)) connectique.push(libelle);
  }

  // "USB" seul n'apporte rien quand une version precise est deja citee.
  const precise = connectique.some((x) => x.startsWith("USB ") || x === "USB-C");
  const retenus = connectique.filter((x) => !(x === "USB" && precise));

  if (retenus.length > 0) ajouter(`Connectique ${retenus.slice(0, 5).join(", ")}`);

  for (const [motif, libelle] of [
    [/\bINCURVE\b|\bCURVED\b/, "Écran incurvé"],
    [/\bVESA\b/, "Fixation VESA"],
    [/\bRECTO\s?VERSO\b|\bDUPLEX\b/, "Impression recto verso"],
    [/\bMULTIFONCTION\b|\bMFP\b|\b3\s?EN\s?1\b/, "Multifonction"],
    [/\bADF\b|\bCHARGEUR\s?AUTOMATIQUE\b/, "Chargeur automatique de documents"],
    [/\bRETROECLAIRE\b|\bBACKLIT\b/, "Clavier rétroéclairé"],
    [/\bANC\b|\bREDUCTION\s?(DE\s?)?BRUIT\b/, "Réduction de bruit"],
    // "MICRO" seul designe un microphone ; accole, il qualifie un connecteur
    // ("Micro-USB") ou un format de carte ("Micro SD").
    [/\bMICRO\b(?![-\s]?(SD|USB|B\b))/, "Microphone intégré"],
    [/\bRECHARGEABLE\b/, "Rechargeable"],
    [/\bPLIABLE\b|\bFOLDABLE\b/, "Pliable"],
    [/\bMONTABLE\s?EN\s?RACK\b|\bRACKABLE\b|\b19\s?POUCES?\s?RACK\b/, "Montage en baie 19\""],
  ]) {
    if (motif.test(t)) ajouter(libelle);
  }

  for (const [motif, libelle] of [
    [/\bPOE\b/, "Alimentation PoE"],
    [/\bWIFI\b|\bSANS FIL\b|\bWIRELESS\b/, "Sans fil"],
    [/\bBLUETOOTH\b/, "Bluetooth"],
    [/\bTACTILE\b|\bTOUCH\b/, "Écran tactile"],
    [/\bRGB\b/, "Rétroéclairage RGB"],
    [/\bETANCHE\b|\bIP6[567]\b/, "Résistant aux intempéries"],
    [/\bCOLORVU\b/, "Vision nocturne couleur"],
    [/\bX360\b|\bYOGA\b/, "Écran rabattable à 360°"],
  ]) {
    if (motif.test(t)) ajouter(libelle);
  }

  return specs;
}

const SUFFIXE_SEO = " - Nahda Smart";

// Ce qu'est le produit, et a quoi il sert.
//
// Ce savoir porte sur le TYPE d'article, pas sur l'exemplaire : un cable CAT6
// tient le Gigabit sur cent metres, quelle qu'en soit la marque. C'est donc
// verifiable, contrairement aux caracteristiques d'une machine d'occasion,
// que seul le magasin connait.
//
// L'ordre compte : le premier motif qui correspond gagne, du plus precis au
// plus general.
const TYPES = [
  [/\bCHARGEUR\b.*\b(PC|PORTABLE|LAPTOP)\b|\bADP-/, "Chargeur secteur pour ordinateur portable",
    "Vérifiez la tension, l'ampérage et la forme de l'embout avant de commander : un chargeur mal apparié n'alimente pas la machine, ou l'abîme."],
  [/\bCHARGEUR\b.*\bCAMERA\b|\bCOFFRET ALIMENTATION\b/, "Alimentation pour caméras de surveillance",
    "Alimente plusieurs caméras depuis un point unique, ce qui évite un transformateur par poste."],
  [/\bCHARGEUR\b/, "Chargeur", "Contrôlez le connecteur et la puissance délivrée avant l'achat."],
  [/\bBATTERIE\b.*\b(PC|PORTABLE)\b/, "Batterie de remplacement pour ordinateur portable",
    "La référence est propre au modèle : relevez celle inscrite sur la batterie d'origine avant de commander."],
  [/\bPOWER BANK\b/, "Batterie externe",
    "Recharge téléphone ou tablette en déplacement. La capacité en mAh donne le nombre de charges possibles."],
  [/\bPILE?\b|\bBATTERIE\b/, "Pile", "Vérifiez le format et la tension indiqués sur la pile à remplacer."],

  // Les composants passent avant les machines : "RAM 8 GO DDR4 PC Portable"
  // est une barrette POUR portable, et non un ordinateur portable.
  [/\bRAM\b|\bMEMOIRE\b.*\bDDR\b/, "Barrette de mémoire vive",
    "La génération DDR et le format doivent correspondre à la carte mère : une DDR4 n'entre pas dans un support DDR3."],
  [/\bCARTE MERE\b|\bMOTHERBOARD\b/, "Carte mère", ""],
  [/\bCARTE GRAPHIQUE\b/, "Carte graphique",
    "Vérifiez la longueur de la carte et la puissance de l'alimentation avant l'achat."],
  [/\bBOITIER\b.*\b(GAMER|ATX)\b/, "Boîtier d'ordinateur", ""],
  [/\bPROCESSEUR\b|\bCPU\b/, "Processeur", "Le socket doit correspondre à celui de la carte mère."],
  [/\bAFFICHEUR\b|\bDALLE\b/, "Dalle d'écran de remplacement",
    "Relevez la référence de la dalle d'origine : la taille seule ne suffit pas, le connecteur et le nombre de broches doivent correspondre."],

  [/\bPC PORTABLE\b|\bLPT\b|\bZBOOK\b|\bELITEBOOK\b|\bTHINKPAD\b|\bIDEAPAD\b|\bLATITUDE\b|\bPROBOOK\b/,
    "Ordinateur portable", "Convient au travail bureautique, à la navigation et aux usages professionnels courants."],
  [/\bALL IN ONE\b|\bAIO\b/, "Ordinateur tout-en-un",
    "L'unité centrale est intégrée à l'écran : un seul câble d'alimentation, et un bureau dégagé."],
  [/\bPC BUREAU\b|\bUC\b|\bELITEDESK\b|\bOPTIPLEX\b|\bTHINKCENTRE\b/, "Ordinateur de bureau",
    "Se raccorde à un écran, un clavier et une souris, vendus séparément."],

  [/\bECRAN\b|\bMONITEUR\b/, "Écran d'ordinateur",
    "Vérifiez que votre unité centrale dispose de la même connectique que l'écran, ou prévoyez l'adaptateur."],
  [/\bCLAVIER\b.*\bSOURIS\b|\bSOURIS\b.*\bCLAVIER\b/, "Ensemble clavier et souris",
    "Livré avec un seul récepteur sur les modèles sans fil, ce qui libère un port USB."],
  [/\bCLAVIER\b/, "Clavier", "Vérifiez la disposition des touches : AZERTY, QWERTY ou arabe."],
  [/\bSOURIS\b/, "Souris", "Les modèles sans fil demandent un port USB libre pour leur récepteur."],
  [/\bWEB ?CAM\b/, "Webcam", "Se branche en USB, sans pilote à installer sur les systèmes récents."],
  [/\bSCAN(N)?ER\b/, "Scanner", "Numérise documents et photos vers l'ordinateur."],

  [/\bTONER\b/, "Cartouche de toner pour imprimante laser",
    "Vérifiez la référence exigée par votre imprimante : une cartouche non compatible n'est pas reconnue."],
  [/\bCARTOUCHE\b|\bENCRE\b/, "Cartouche d'encre",
    "Vérifiez la référence attendue par votre imprimante avant de commander."],
  [/\bIMPRIMANTE\b/, "Imprimante", "Vérifiez le coût des consommables autant que le prix de la machine."],
  [/\bROULEAU\b.*\bTHERMIQUE\b|\bETIQUETTES?\b.*\bTHERMIQUE\b/, "Consommable thermique",
    "Pour imprimante de tickets ou d'étiquettes : contrôlez la largeur du rouleau."],

  [/\bCABLE RESEAU\b|\bCABLE UTP\b|\bJARRETIERE\b|\bCABLE RJ45\b/, "Câble réseau RJ45",
    "Relie un poste, une caméra IP ou un point d'accès à votre switch. Le CAT6 tient le Gigabit jusqu'à cent mètres."],
  [/\bCABLE HDMI\b|\bEXTENDER HDMI\b/, "Câble HDMI",
    "Transporte l'image et le son en numérique vers un écran ou un vidéoprojecteur."],
  [/\bCABLE VGA\b/, "Câble VGA",
    "Liaison analogique vers un écran ou un vidéoprojecteur. Il transporte l'image seule : le son passe par un autre câble."],
  [/\bCABLE BNC\b|\bCONNECTEUR BNC\b|\bFICHE BNC\b/, "Connectique BNC pour vidéosurveillance analogique",
    "Utilisée par les caméras analogiques et les enregistreurs DVR."],
  [/\bCABLE\b.*\b(IPHONE|APPLE|LIGHTNING)\b/, "Câble de charge et de synchronisation pour appareil Apple", ""],
  [/\bRALLONGE USB\b|\bCABLE RALLONGE\b/, "Rallonge USB",
    "Éloigne un périphérique de l'unité centrale. Au-delà de cinq mètres, une rallonge active est préférable."],
  [/\bADAPTATEUR\b|\bCONVERTISSEUR\b/, "Adaptateur de connectique",
    "Permet de relier deux appareils dont les ports diffèrent. Vérifiez le sens de conversion : tous ne fonctionnent pas dans les deux sens."],
  [/\bCABLE ALIMENTATION\b|\bCORDON\b/, "Câble d'alimentation", ""],
  [/\bCABLE\b/, "Câble", ""],

  [/\bCLE WIFI\b|\bADAPTATEUR WIFI\b/, "Clé Wi-Fi USB",
    "Ajoute le Wi-Fi à un poste fixe, ou remplace une carte défaillante sur un portable."],
  [/\bPOINT ACCES\b|\bPOINT D'ACCES\b/, "Point d'accès Wi-Fi",
    "Étend la couverture sans fil d'un réseau existant. Il se raccorde au réseau filaire, contrairement à un répéteur."],
  [/\bSWITCH\b|\bCOMMUTATEUR\b/, "Switch réseau",
    "Raccorde plusieurs appareils en filaire. Les modèles PoE alimentent caméras et bornes par le câble réseau."],
  [/\bROUTEUR\b|\bROUTER\b/, "Routeur", "Distribue la connexion internet vers les postes du réseau, en filaire et en Wi-Fi."],
  [/\bPOWERLINE\b|\bCPL\b/, "Adaptateur CPL",
    "Fait passer le réseau par le câblage électrique, quand tirer un câble réseau n'est pas envisageable."],
  [/\bPANNEAU BRASSAGE\b|\bPATCH PANEL\b/, "Panneau de brassage",
    "Regroupe les arrivées réseau à l'entrée d'une baie et facilite le repérage."],
  [/\bBAIE\b|\bARMOIRE\b.*\bRESEAU\b|\bRACK\b/, "Baie de brassage",
    "Abrite switches, panneaux et enregistreurs. La hauteur se compte en U, un U valant 4,4 cm."],

  [/\bCAMERA\b/, "Caméra de vidéosurveillance",
    "Vérifiez la compatibilité avec votre enregistreur : une caméra IP ne se branche pas sur un DVR analogique."],
  [/\bDVR\b|\bNVR\b|\bENREGISTREUR\b/, "Enregistreur de vidéosurveillance",
    "Le nombre de voies fixe le nombre de caméras raccordables. Le disque dur est souvent vendu à part."],
  [/\bSUPPORT\b.*\bCAMERA\b/, "Support de caméra", "Fixation murale ou plafond."],
  [/\bALARME\b|\bSIRENE\b|\bDETECTEUR\b/, "Équipement d'alarme", ""],
  [/\bPOINTEUSE\b|\bCONTROLE D'ACCES\b|\bSERRURE\b/, "Contrôle d'accès et de présence", ""],

  [/\bDISQUE DUR\b.*\bSSD\b|\bSSD\b/, "Disque SSD",
    "Bien plus rapide qu'un disque mécanique : c'est le remplacement qui rajeunit le plus une machine ancienne."],
  [/\bDISQUE DUR\b/, "Disque dur", "Vérifiez le format et l'interface attendus par votre machine."],
  [/\bBOITIER\b.*\bDISQUE\b/, "Boîtier pour disque dur",
    "Transforme un disque interne en disque externe USB. Le format du boîtier doit correspondre à celui du disque."],
  [/\bCLE USB\b/, "Clé USB", ""],
  [/\bMICRO ?SD\b|\bCARTE MEMOIRE\b/, "Carte mémoire", "Vérifiez la classe de vitesse exigée par votre appareil."],
  [/\bNAS\b/, "Serveur de stockage en réseau", "Partage et sauvegarde les fichiers de plusieurs postes."],

  [/\bCASQUE\b|\bECOUTEUR\b|\bAIRPODS\b/, "Audio personnel", ""],
  [/\bHAUT ?PARLEUR\b|\bSPEAKER\b|\bENCEINTE\b|\bBARRE DE SON\b/, "Enceinte", ""],
  [/\bTELEVISION\b|\bTV\b(?!.*SUPPORT)/, "Téléviseur", ""],
  [/\bSUPPORT\b.*\bTV\b/, "Support de téléviseur",
    "Vérifiez la norme VESA et le poids maximal supporté avant la pose."],
  [/\bVIDEOPROJECTEUR\b|\bPROJECTEUR\b/, "Vidéoprojecteur", ""],

  [/\bGLASS\b|\bVERRE TREMPE\b|\bPROTECTION ECRAN\b/, "Protection d'écran en verre trempé",
    "Se pose sur l'écran du téléphone et absorbe les chocs à sa place."],
  [/\bPOCHETTE\b|\bCOQUE\b|\bHOUSSE\b|\bCOVER\b/, "Protection pour téléphone ou tablette", ""],
  [/\bTELEPHONE\b|\bSIP-\b|\bIP PHONE\b/, "Téléphone", ""],
  [/\bTABLETTE\b/, "Tablette", ""],

  [/\bCARTABLE\b|\bSAC A DOS\b|\bSACOCHE\b/, "Sacoche pour ordinateur portable",
    "Vérifiez la taille annoncée en pouces, elle correspond à la diagonale de l'écran."],
  [/\bONDULEUR\b|\bUPS\b/, "Onduleur",
    "Maintient l'alimentation le temps d'éteindre proprement, et protège des surtensions."],
  [/\bRALLONGE\b|\bMULTIPRISE\b|\bPRISE\b/, "Rallonge électrique", ""],
  [/\bLAMPE\b|\bLED\b.*\b(GU10|TABLE)\b/, "Éclairage LED", ""],
  [/\bVENTILATEUR\b|\bCLIMATISEUR\b/, "Ventilation", ""],
  [/\bLECTEUR CODE\b|\bDOUCHETTE\b/, "Lecteur de code-barres",
    "Se branche en USB et se comporte comme un clavier : aucun logiciel particulier n'est requis."],
  [/\bLICENCE\b|\bANTIVIRUS\b|\bWINDOWS\b|\bOFFICE\b/, "Licence logicielle",
    "La clé est fournie à l'achat. Vérifiez le nombre de postes couverts et la durée."],
];

function typeDeProduit(nom) {
  const t = nom.toUpperCase();

  for (const [motif, nature, usage] of TYPES) {
    if (motif.test(t)) return { nature, usage };
  }

  return null;
}

function redigerFiche({ nom, categorieSlug, marque, garantie }) {
  const specs = extraireSpecs(nom);
  const nomCategorie = NOM_CATEGORIE[categorieSlug] ?? "produit";
  const marqueConnue = marque && marque !== "Générique";
  const type = typeDeProduit(nom);

  // On annonce ce que le produit EST avant de le decrire : "Cable reseau RJ45"
  // renseigne le client, "accessoire informatique" ne lui apprend rien.
  const nature = type ? type.nature : nomCategorie;
  const accroche = marqueConnue
    ? `${nom} — ${nature} de marque ${marque}.`
    : `${nom} — ${nature}.`;

  const phrases = [accroche];

  if (specs.length > 0) {
    phrases.push(`Caractéristiques principales : ${specs.join(", ")}.`);
  }

  if (type?.usage) phrases.push(type.usage);

  phrases.push(
    `Garantie ${garantie} mois. Livraison partout au Maroc, retrait possible en magasin. ` +
      `Notre équipe reste joignable pour vous conseiller avant l'achat.`,
  );

  // shortDescription alimente les cartes du catalogue : elle doit tenir sur
  // deux lignes. On prend les specs si on en a, sinon une phrase courte.
  const repli = type ? type.nature : `${nomCategorie.charAt(0).toUpperCase()}${nomCategorie.slice(1)}`;
  const resume =
    specs.length > 0
      ? [type ? type.nature : null, ...specs].filter(Boolean).slice(0, 4).join(" • ")
      : marqueConnue
        ? `${repli} ${marque}`
        : repli;

  return {
    shortDescription: resume.slice(0, 180),
    description: phrases.join(" "),
    // On raccourcit le nom, jamais l'enseigne : couper la chaine entiere a 70
    // signes produisait des titres finissant par "- Nahda Sma".
    seoTitle:
      nom.length + SUFFIXE_SEO.length <= 70
        ? `${nom}${SUFFIXE_SEO}`
        : `${nom.slice(0, 70 - SUFFIXE_SEO.length - 1).trimEnd()}…${SUFFIXE_SEO}`,
    seoDescription: (specs.length > 0
      ? `${nom}. ${specs.slice(0, 5).join(", ")}. Garantie ${garantie} mois, livraison partout au Maroc.`
      : `${nom}. Disponible chez Nahda Smart, garantie ${garantie} mois, livraison partout au Maroc.`
    ).slice(0, 160),
    specsTrouvees: specs.length,
  };
}

const client = new pg.Client({ connectionString: databaseUrl });
const stats = { examines: 0, reecrits: 0, nomsNettoyes: 0, sansSpec: 0 };
const apercu = [];

try {
  await client.connect();

  // Une fiche encore brute est une fiche dont la description n'est que la
  // designation recopiee : soit integralement en majuscules, soit strictement
  // egale au nom du produit. Le seul test sur les majuscules laissait passer
  // les designations contenant une minuscule ("i7-10510u"), qui restaient
  // affichees telles quelles en boutique.
  const filtre = tout
    ? `p.description = upper(p.description)
       OR upper(btrim(p.description)) = upper(btrim(p.name))
       OR p.description LIKE '%vous conseiller avant l''achat.'`
    : `p.description = upper(p.description) OR upper(btrim(p.description)) = upper(btrim(p.name))`;

  const { rows } = await client.query(`
    SELECT p.id, p.name, p."warrantyMonths", c.slug AS categorie, b.name AS marque
      FROM "Product" p
      JOIN "Category" c ON c.id = p."categoryId"
      JOIN "Brand" b ON b.id = p."brandId"
     WHERE ${filtre}
     ORDER BY p.name
  `);

  if (apply) await client.query("BEGIN");

  for (const produit of rows) {
    stats.examines += 1;

    const nom = nettoyerNom(produit.name);
    if (nom !== produit.name) stats.nomsNettoyes += 1;

    const fiche = redigerFiche({
      nom,
      categorieSlug: produit.categorie,
      marque: produit.marque,
      garantie: produit.warrantyMonths,
    });

    if (fiche.specsTrouvees === 0) stats.sansSpec += 1;
    stats.reecrits += 1;

    if (apercu.length < 6) apercu.push({ nom, ...fiche });

    if (apply) {
      await client.query(
        `UPDATE "Product"
            SET name = $2,
                "shortDescription" = $3,
                description = $4,
                "seoTitle" = $5,
                "seoDescription" = $6,
                "updatedAt" = NOW()
          WHERE id = $1`,
        [
          produit.id,
          nom,
          fiche.shortDescription,
          fiche.description,
          fiche.seoTitle,
          fiche.seoDescription,
        ],
      );
    }
  }

  if (apply) await client.query("COMMIT");
} catch (erreur) {
  if (apply) await client.query("ROLLBACK").catch(() => {});
  console.error("Interrompu :", erreur.message);
  process.exitCode = 1;
} finally {
  await client.end();
}

console.log(apply ? "=== FICHES REECRITES ===" : "=== SIMULATION (ajouter --apply pour ecrire) ===");
console.log(`Fiches examinees        : ${stats.examines}`);
console.log(`Fiches reecrites        : ${stats.reecrits}`);
console.log(`  sans caracteristique  : ${stats.sansSpec}`);
console.log(`Noms nettoyes           : ${stats.nomsNettoyes}`);
console.log();

for (const a of apercu) {
  console.log(`--- ${a.nom}`);
  console.log(`    resume : ${a.shortDescription}`);
  console.log(`    fiche  : ${a.description}`);
}
