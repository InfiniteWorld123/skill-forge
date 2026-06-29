import { Hono } from "hono";
import { getAdminIndex } from "./admin.controller.js";
import accountsRoute from "./accounts/accounts.routes.js";
import analyticsRoute from "./analytics/analytics.routes.js";
import catalogRoute from "./catalog/catalog.routes.js";
import certificatesRoute from "./certificates/certificates.routes.js";
import coursesRoute from "./courses/courses.routes.js";
import dashboardRoute from "./dashboard/dashboard.routes.js";
import enrollmentsRoute from "./enrollments/enrollments.routes.js";
import mediaRoute from "./media/media.routes.js";
import ordersRoute from "./orders/orders.routes.js";
import qnaRoute from "./qna/qna.routes.js";
import reviewsRoute from "./reviews/reviews.routes.js";
import teachersRoute from "./teachers/teachers.routes.js";
import usersRoute from "./users/users.routes.js";
import { requireAdmin } from "../../shared/middlewares/auth-context.js";

const adminRoute = new Hono()
	.use("*", requireAdmin)
	.get("/", ...getAdminIndex)
	.route("/accounts", accountsRoute)
	.route("/dashboard", dashboardRoute)
	.route("/users", usersRoute)
	.route("/teachers", teachersRoute)
	.route("/courses", coursesRoute)
	.route("/catalog", catalogRoute)
	.route("/orders", ordersRoute)
	.route("/enrollments", enrollmentsRoute)
	.route("/reviews", reviewsRoute)
	.route("/qna", qnaRoute)
	.route("/media", mediaRoute)
	.route("/certificates", certificatesRoute)
	.route("/analytics", analyticsRoute);

export type AdminAppType = typeof adminRoute;
export default adminRoute;
