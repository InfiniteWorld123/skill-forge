import type { ErrorHandler } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { APIError } from "better-auth/api";
import { isAppError } from "../constants/errors.js";
import { HttpStatusCode } from "../constants/http.js";

export const errorHandler: ErrorHandler = (err, c) => {
  if (isAppError(err)) {
    return c.json(
      {
        success: false,
        code: err.code,
        message: err.message,
        details: err.details,
      },
      err.status as ContentfulStatusCode,
    );
  }

  if (err instanceof APIError) {
    return c.json(
      {
        success: false,
        code: err.body?.code ?? "AUTH_ERROR",
        message: err.body?.message ?? err.message ?? "Authentication error",
      },
      (err.statusCode ?? HttpStatusCode.BAD_REQUEST) as ContentfulStatusCode,
    );
  }

  console.error(err);

  return c.json(
    {
      success: false,
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred",
    },
    HttpStatusCode.INTERNAL_SERVER_ERROR,
  );
};
