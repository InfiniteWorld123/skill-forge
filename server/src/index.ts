import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { auth } from "./utils/auth.js";
import authRoute from "./routes/auth.route.js";
import { errorHandler } from "./middlewares/error-handler.js";

const app = new Hono();

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));
app.route("/", authRoute);

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.onError(errorHandler);

serve(
  {
    fetch: app.fetch,
    port: 8000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  },
);
