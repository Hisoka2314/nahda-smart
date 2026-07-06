import { NextResponse } from "next/server";
import type { ZodError } from "zod";

export type ApiFieldErrors = Record<string, string>;

export function okJson<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, ...data }, init);
}

export function errorJson(
  message: string,
  status = 400,
  fieldErrors?: ApiFieldErrors,
  init?: ResponseInit,
) {
  return NextResponse.json(
    {
      ok: false,
      message,
      ...(fieldErrors ? { fieldErrors } : {}),
    },
    { ...init, status },
  );
}

export function fieldErrorsFromZod(error: ZodError): ApiFieldErrors {
  return error.issues.reduce<ApiFieldErrors>((errors, issue) => {
    const field = getClientFieldName(issue.path);

    if (field && !errors[field]) {
      errors[field] = issue.message;
    }

    return errors;
  }, {});
}

function getClientFieldName(path: PropertyKey[]) {
  const last = path[path.length - 1];

  if (typeof last === "string") return last;
  if (typeof path[0] === "string") return path[0];

  return "form";
}
