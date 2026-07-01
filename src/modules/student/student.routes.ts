import { Hono } from "hono";
import { requireStudent } from "../../shared/middlewares/auth-context.js";
import { jsonOk } from "../../shared/utils/json-response.js";
import cartRoute from "./cart/cart.routes.js";
import certificatesRoute from "./certificates/certificates.routes.js";
import checkoutRoute from "./checkout/checkout.routes.js";
import coursesRoute from "./courses/courses.routes.js";
import enrollmentsRoute from "./enrollments/enrollments.routes.js";
import progressRoute from "./progress/progress.routes.js";
import qnaRoute from "./qna/qna.routes.js";
import reviewsRoute from "./reviews/reviews.routes.js";

const studentRoute = new Hono()
	.use("*", requireStudent)
	.get("/", (c) =>
		jsonOk({
			c,
			message: "Student API",
			data: {
				basePath: "/student",
				sections: [
					"/student/cart",
					"/student/certificates",
					"/student/checkout",
					"/student/courses",
					"/student/enrollments",
					"/student/progress",
					"/student/qna",
					"/student/reviews",
				],
			},
		}),
	)
	.route("/cart", cartRoute)
	.route("/certificates", certificatesRoute)
	.route("/checkout", checkoutRoute)
	.route("/courses", coursesRoute)
	.route("/enrollments", enrollmentsRoute)
	.route("/progress", progressRoute)
	.route("/qna", qnaRoute)
	.route("/reviews", reviewsRoute);

export type StudentAppType = typeof studentRoute;
export default studentRoute;
