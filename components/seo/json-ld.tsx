// Donnees structurees schema.org. Elles permettent a Google d'afficher prix,
// disponibilite et fil d'ariane directement dans les resultats de recherche.
// Le JSON est serialise avec echappement de "<" pour qu'aucune valeur issue
// de la base ne puisse fermer la balise script.
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replaceAll("<", "\\u003c"),
      }}
    />
  );
}
