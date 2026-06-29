import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export const jsonOk = <T>({c, data, message, status = 200}: {
  c: Context,
  data: T,
  message: string,
  status?: ContentfulStatusCode},
) => {
  return c.json({ success: true as const, message, data }, status);
};
