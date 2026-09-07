// Detection de la marque a partir de la designation d'inventaire.
//
// Source unique : l'import d'inventaire et le reclassement s'en servent tous
// deux, faute de quoi les deux versions divergent au premier ajustement.

// Ordonnee du plus long au plus court : "TP-LINK" doit etre teste avant "TP".
export const MARQUES = [
  ["HIKVISION", "Hikvision"], ["GRANDSTREAM", "Grandstream"], ["PANASONIC", "Panasonic"],
  ["LOGITECH", "Logitech"], ["HONEYWELL", "Honeywell"], ["MICROSOFT", "Microsoft"],
  ["KINGSTON", "Kingston"], ["VERBATIM", "Verbatim"], ["SAMSUNG", "Samsung"],
  ["GIGABYTE", "Gigabyte"], ["UBIQUITI", "Ubiquiti"], ["TOSHIBA", "Toshiba"],
  ["SANDISK", "SanDisk"], ["KYOCERA", "Kyocera"], ["LEXMARK", "Lexmark"],
  ["SEAGATE", "Seagate"], ["BROTHER", "Brother"], ["PHILIPS", "Philips"],
  ["SYLVANIA", "Sylvania"], ["TP-LINK", "TP-Link"], ["TPLINK", "TP-Link"],
  ["D-LINK", "D-Link"], ["DLINK", "D-Link"], ["ZKTECO", "ZKTeco"],
  ["LENOVO", "Lenovo"], ["YEALINK", "Yealink"], ["HUAWEI", "Huawei"],
  ["XIAOMI", "Xiaomi"], ["ORAIMO", "Oraimo"], ["EZVIZ", "EZVIZ"],
  ["ARCTIC", "Arctic"], ["CANON", "Canon"], ["EPSON", "Epson"],
  ["DAHUA", "Dahua"], ["ZEBRA", "Zebra"], ["HENEX", "Henex"],
  ["SYBEL", "Sybel"], ["MUTEX", "Mutex"], ["XEROX", "Xerox"],
  ["APPLE", "Apple"], ["IPHONE", "Apple"], ["INTEL", "Intel"],
  ["ASUS", "ASUS"], ["ACER", "Acer"], ["SONY", "Sony"],
  ["BENQ", "BenQ"], ["DELL", "Dell"], ["OMEGA", "Omega"],
  ["ANKER", "Anker"], ["HAVIT", "Havit"], ["TRUST", "Trust"],
  ["RAPOO", "Rapoo"], ["CISCO", "Cisco"], ["EATON", "Eaton"],
  ["MERCURY", "Mercury"], ["EXTROM", "Extrom"], ["ADATA", "ADATA"],
  ["TENDA", "Tenda"], ["REMAX", "Remax"], ["INTEX", "Intex"], ["HOCO", "Hoco"],
  ["MSI", "MSI"], ["AMD", "AMD"], ["APC", "APC"],
  ["JBL", "JBL"], ["LG", "LG"], ["WD", "Western Digital"], ["HP", "HP"],

  // Fabricants presents au catalogue et absents de la table : 64 references
  // en stock portaient leur nom dans la designation et sortaient malgre tout
  // en "Generique". Un client qui filtrait sur Netis ou Rongta ne trouvait
  // rien, et la fiche annoncait une marque que la boite dementait.
  //
  // "ZKT" est l'abreviation que le magasin emploie pour ZKTeco : sans elle,
  // la marque existait en base sans un seul produit.
  ["KONICA MINOLTA", "Konica Minolta"], ["KONICA", "Konica Minolta"],
  ["GREATNICE", "Greatnice"], ["SUNSONNY", "Sunsonny"], ["KAKUSIGA", "Kakusiga"],
  ["XPRINTER", "Xprinter"], ["BIOSTAR", "Biostar"], ["ECHOSAT", "Echosat"],
  ["TENWANT", "Tenwant"], ["AZATECH", "Azatech"], ["KYOCERA", "Kyocera"],
  ["FJ-STAR", "FJ-Star"], ["FJ STAR", "FJ-Star"], ["SING-E", "Sing-e"],
  ["ASTROO", "Astroo"], ["CLEDOR", "Cledor"], ["RONGTA", "Rongta"],
  ["VENCOR", "Vencor"], ["BAGULE", "Bagule"], ["BIAGJI", "Biagji"],
  ["KIOXIA", "Kioxia"], ["MAMCOM", "Mamcom"], ["RENATA", "Renata"],
  ["SENIC", "Senic"], ["NEWAY", "Neway"], ["JEDEL", "Jedel"],
  ["IBOGA", "Iboga"], ["HUION", "Huion"], ["LEXAR", "Lexar"],
  ["NETIS", "Netis"], ["VARTA", "Varta"], ["KODAK", "Kodak"],
  ["RICOH", "Ricoh"], ["BEST1", "Best1"], ["TLAI", "Tlai"],
  ["CUDY", "Cudy"], ["GOUI", "Goui"], ["XENX", "Xenx"],
  ["ZKT", "ZKTeco"], ["NIA", "Nia"],

  // Deux ecarts d'orthographe, de nature opposee :
  //   - "HAVIC" est une coquille pour Havit, fabricant de peripheriques de
  //     jeu. La marque existait en base sans un seul produit.
  //   - "ACERO" n'est PAS Acer : c'est une autre marque, sur des ecouteurs.
  //     La ressemblance ne vaut pas identite, et Acer reste sans produit.
  ["HAVIC", "Havit"], ["ACERO", "Acero"],
];

export const MARQUE_GENERIQUE = "Générique";

// Marques de consommables compatibles. Leur designation nomme l'imprimante
// visee : "TONER PODIUM CF217A HP" est une cartouche Podium POUR imprimante
// HP, et non une cartouche HP. Sans cette garde, le catalogue presentait deux
// cartouches de marque tierce comme des consommables d'origine -- une
// affirmation fausse, et la plus couteuse a laisser passer sur une fiche.
//
// Les marques compatibles qui figurent dans MARQUES (Omega, par exemple) n'y
// sont pas : elles sont bien le fabricant de la cartouche.
const MARQUES_COMPATIBLES =
  /(?<![A-Z])(PODIUM|STAR ?INK|NEW ?WORD|WORD|IMAX|EURO ?TONER|ENERGIES|BESTPRINT|NEUTRE|COMPATIBLE|ADAPTABLE|REMANUFACTURE)(?![A-Z])/;

export function detecterMarque(designation) {
  const texte = designation.toUpperCase();

  if (MARQUES_COMPATIBLES.test(texte)) return MARQUE_GENERIQUE;

  for (const [motif, nom] of MARQUES) {
    const regex = new RegExp(`(?<![A-Z0-9])${motif.replace(/[-]/g, "\\-")}(?![A-Z0-9])`);
    if (regex.test(texte)) return nom;
  }

  return MARQUE_GENERIQUE;
}
