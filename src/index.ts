import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import adminRoute from "./modules/admin/admin.routes.js";
import authRoute from "./modules/auth/auth.routes.js";
import sharedRoute from "./modules/shared/shared.routes.js";
import studentRoute from "./modules/student/student.routes.js";
import teacherRoute from "./modules/teacher/teacher.routes.js";
import { attachAuthContext } from "./shared/middlewares/auth-context.js";
import { errorHandler } from "./shared/middlewares/error-handler.js";
import { auth } from "./shared/utils/auth.js";

const app = new Hono();
const port = Number(process.env.PORT ?? 8000);

app.use("*", attachAuthContext);
app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));
app.route("/", authRoute);
app.route("/shared", sharedRoute);
app.route("/student", studentRoute);
app.route("/teacher", teacherRoute);
app.route("/admin", adminRoute);

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.onError(errorHandler);

serve(
	{
		fetch: app.fetch,
		port,
	},
	(info) => {
		console.log(`Server is running on http://localhost:${info.port}`);
  },
);
