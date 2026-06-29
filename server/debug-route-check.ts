import "dotenv/config";
import { auth } from "./src/utils/auth.js";

const candidates = ["/api/auth/sign-up", "/api/auth/sign-up/email"];

for (const path of candidates) {
  const res = await auth.handler(
    new Request(`http://localhost:8000${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Route Check",
        email: `route-check-${Date.now()}@example.com`,
        password: "Sup3rSecret!23",
      }),
    }),
  );
  console.log(path, "->", res.status);
}
