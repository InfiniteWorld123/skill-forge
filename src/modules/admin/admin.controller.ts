import { createFactory } from "hono/factory";
import { jsonOk } from "../../shared/utils/json-response.js";

const factory = createFactory();

export const getAdminIndex = factory.createHandlers(async (c) => {
	return jsonOk({
		c,
		message: "Admin API skeleton",
		data: {
			businessMeaning:
				"This is the main admin area. Admin APIs help control the platform like a real SaaS dashboard.",
			basePath: "/admin",
			sections: [
				"/admin/accounts",
				"/admin/dashboard",
				"/admin/users",
				"/admin/teachers",
				"/admin/courses",
				"/admin/catalog",
				"/admin/orders",
				"/admin/enrollments",
				"/admin/reviews",
				"/admin/qna",
				"/admin/media",
				"/admin/certificates",
				"/admin/analytics",
			],
		},
	});
});
