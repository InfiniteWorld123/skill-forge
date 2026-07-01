import { Hono } from "hono";
import { jsonOk } from "../../shared/utils/json-response.js";
import categoriesRoute from "./categories/categories.routes.js";
import certificatesRoute from "./certificates/certificates.routes.js";
import coursesRoute from "./courses/courses.routes.js";
import profilesRoute from "./profiles/profiles.routes.js";

const sharedRoute = new Hono()
	.get("/", (c) =>
		jsonOk({
			c,
			message: "Shared API",
			data: {
				basePath: "/shared",
				sections: [
					"/shared/categories",
					"/shared/certificates",
					"/shared/courses",
					"/shared/profiles",
				],
			},
		}),
	)
	.route("/categories", categoriesRoute)
	.route("/certificates", certificatesRoute)
	.route("/courses", coursesRoute)
	.route("/profiles", profilesRoute);

export type SharedAppType = typeof sharedRoute;
export default sharedRoute;
