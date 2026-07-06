export const adminSuccessMessages: Record<string, string> = {
  created: "Creation enregistree avec succes.",
  updated: "Modification enregistree avec succes.",
  archived: "Produit archive. Il ne sera plus visible dans le catalogue public.",
  image: "Image ajoutee avec succes.",
  "image-updated": "Image mise a jour.",
  "image-deleted": "Image supprimee.",
  attribute: "Attribut enregistre.",
  movement: "Mouvement de stock enregistre.",
  threshold: "Seuil de stock mis a jour.",
  logo: "Logo ajoute avec succes.",
  "logo-removed": "Logo supprime. Le fallback typographique sera utilise.",
  group: "Groupe de filtres cree.",
  "group-updated": "Groupe de filtres mis a jour.",
  "attribute-updated": "Attribut technique mis a jour.",
  option: "Option de filtre creee.",
  "option-updated": "Option de filtre mise a jour.",
  "customer-created": "Client cree avec succes.",
  "customer-updated": "Client mis a jour.",
  "customer-note": "Note interne ajoutee.",
  "manual-order": "Commande manuelle creee.",
  "supplier-created": "Fournisseur cree avec succes.",
  "supplier-updated": "Fournisseur mis a jour.",
  "supplier-note": "Note fournisseur ajoutee.",
  "supplier-purchase": "Achat fournisseur cree.",
  "supplier-purchase-received": "Achat fournisseur valide et stock alimente.",
  "supplier-payment": "Paiement fournisseur mis a jour.",
  "supplier-purchase-cancelled": "Achat fournisseur annule.",
  "sav-created": "Ticket SAV cree avec succes.",
  "sav-status": "Statut SAV mis a jour.",
  "sav-note": "Note SAV ajoutee.",
  "sav-repaired": "Ticket SAV marque repare.",
  "sav-replaced": "Ticket SAV marque remplace.",
  "sav-closed": "Ticket SAV cloture.",
  "contact-status": "Statut du lead mis a jour.",
  "lead-no-answer": "Tentative enregistree : lead marque sans reponse.",
  "lead-callback": "Rappel planifie pour ce lead.",
  "lead-note": "Note du lead enregistree.",
};

export const adminErrorMessages: Record<string, string> = {
  archive: "Impossible d'archiver ce produit pour le moment.",
  attribute: "Impossible d'enregistrer cet attribut. Verifiez la valeur saisie.",
  "image-delete": "Impossible de supprimer cette image.",
  "image-update": "Impossible de mettre a jour cette image.",
  image: "Image refusee. Utilisez JPG, PNG ou WebP avec une taille raisonnable.",
  logo: "Logo refuse. Utilisez un asset JPG, PNG ou WebP autorise.",
  "logo-remove": "Impossible de supprimer ce logo.",
  save: "Impossible d'enregistrer les modifications.",
  stock: "Mouvement refuse. Verifiez le depot, le type et le stock disponible.",
  threshold: "Impossible de mettre a jour le seuil.",
  unique: "Un slug ou SKU identique existe deja.",
  validation: "Certaines informations sont manquantes ou invalides.",
  "customer-create": "Impossible de creer ce client. Verifiez le telephone.",
  "customer-update": "Impossible de mettre a jour ce client.",
  "customer-note": "Impossible d'ajouter cette note interne.",
  "manual-order": "Commande manuelle refusee. Verifiez produits, stock et depot.",
  "supplier-create": "Impossible de creer ce fournisseur.",
  "supplier-update": "Impossible de mettre a jour ce fournisseur.",
  "supplier-note": "Impossible d'ajouter cette note fournisseur.",
  "supplier-purchase": "Achat fournisseur refuse. Verifiez fournisseur, produits et montants.",
  "supplier-purchase-received": "Impossible de valider cet achat fournisseur.",
  "supplier-payment": "Paiement fournisseur refuse. Verifiez le montant.",
  "supplier-purchase-cancelled": "Impossible d'annuler cet achat fournisseur.",
  "sav-create": "Impossible de creer ce ticket SAV.",
  "sav-status": "Impossible de mettre a jour le statut SAV.",
  "sav-note": "Impossible d'ajouter cette note SAV.",
  "sav-stock": "Action SAV refusee. Verifiez produit, depot et stock.",
  "contact-status": "Impossible de mettre a jour ce lead.",
  "lead-convert": "Impossible de convertir ce lead en client.",
};

export function getAdminFeedbackMessage({
  success,
  error,
}: {
  success?: string;
  error?: string;
}) {
  if (success) {
    return {
      tone: "success" as const,
      message: adminSuccessMessages[success] ?? "Action realisee avec succes.",
    };
  }

  if (error) {
    return {
      tone: "danger" as const,
      message: adminErrorMessages[error] ?? "Une erreur est survenue.",
    };
  }

  return null;
}
