"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error(error);
    }
  }, [error]);

  return (
    <html lang="fr">
      <body>
        <main
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            background: "#071112",
            color: "#fff",
            padding: "24px",
            fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
          }}
        >
          <section
            style={{
              width: "100%",
              maxWidth: "560px",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "12px",
              background: "rgba(255,255,255,0.06)",
              padding: "32px",
              textAlign: "center",
            }}
          >
            <p
              style={{
                margin: 0,
                color: "#a8c84c",
                fontSize: "12px",
                fontWeight: 900,
                textTransform: "uppercase",
              }}
            >
              Nahda Smart
            </p>
            <h1 style={{ margin: "10px 0 0", fontSize: "28px" }}>
              Erreur technique
            </h1>
            <p style={{ color: "rgba(255,255,255,0.66)", lineHeight: 1.6 }}>
              Une erreur inattendue est survenue. Les details techniques ne sont
              pas affiches cote client.
            </p>
            {error.digest ? (
              <p style={{ color: "rgba(255,255,255,0.42)", fontSize: "12px" }}>
                Reference : {error.digest}
              </p>
            ) : null}
            <button
              onClick={() => unstable_retry()}
              style={{
                height: "44px",
                border: 0,
                borderRadius: "10px",
                background: "#55720f",
                color: "#fff",
                fontWeight: 800,
                padding: "0 18px",
                cursor: "pointer",
              }}
            >
              Reessayer
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
