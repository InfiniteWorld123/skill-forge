import { Hono } from "hono";
import { requireTeacher } from "../../shared/middlewares/auth-context.js";
import { jsonOk } from "../../shared/utils/json-response.js";
import coursesRoute from "./courses/courses.routes.js";
import enrollmentsRoute from "./enrollments/enrollments.routes.js";
import lessonsRoute from "./lessons/lessons.routes.js";
import qnaRoute from "./qna/qna.routes.js";
import reviewsRoute from "./reviews/reviews.routes.js";

const teacherRoute = new Hono()
	.use("*", requireTeacher)
	.get("/", (c) =>
		jsonOk({
			c,
			message: "Teacher API",
			data: {
				basePath: "/teacher",
				sections: [
					"/teacher/courses",
					"/teacher/enrollments",
					"/teacher/lessons",
					"/teacher/qna",
					"/teacher/reviews",
				],
			},
		}),
	)
	.route("/courses", coursesRoute)
	.route("/enrollments", enrollmentsRoute)
	.route("/lessons", lessonsRoute)
	.route("/qna", qnaRoute)
	.route("/reviews", reviewsRoute);

export type TeacherAppType = typeof teacherRoute;
export default teacherRoute;
