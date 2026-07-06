import type { Instrumentation } from "next";

// Journalisation structuree des erreurs serveur (JSON sur stderr) : sur le
// VPS, journalctl / pm2 / docker logs deviennent exploitables et greppables.
// Brancher un provider externe (Sentry, ...) ici le jour venu.
export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context,
) => {
  const details = error instanceof Error
    ? { message: error.message, digest: (error as { digest?: string }).digest }
    : { message: String(error) };

  console.error(
    JSON.stringify({
      level: "error",
      source: "next-request",
      timestamp: new Date().toISOString(),
      path: request.path,
      method: request.method,
      routerKind: context.routerKind,
      routeType: context.routeType,
      ...details,
    }),
  );
};
