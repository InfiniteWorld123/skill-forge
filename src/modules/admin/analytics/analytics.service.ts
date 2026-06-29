import { createAdminEndpointSkeleton } from "../admin.service.js";

export const getUserAnalyticsSkeleton = () => {
	return createAdminEndpointSkeleton({
		area: "Analytics",
		api: "User analytics",
		method: "GET",
		path: "/admin/analytics/users",
		businessMeaning:
			"Admin sees user growth and how many users become teachers or students.",
		dataSource: ["user", "student_profile", "teacher_profile", "enrollment"],
		futureLogic: [
			"Count signups by period.",
			"Calculate teacher count and active learner count.",
		],
	});
};

export const getCourseAnalyticsSkeleton = () => {
	return createAdminEndpointSkeleton({
		area: "Analytics",
		api: "Course analytics",
		method: "GET",
		path: "/admin/analytics/courses",
		businessMeaning:
			"Admin sees which courses are popular and which courses need attention.",
		dataSource: ["course", "enrollment", "course_review", "wishlist_item"],
		futureLogic: [
			"Return top courses by enrollments, rating, and wishlist count.",
			"Return draft, published, and archived course counts.",
		],
	});
};

export const getSalesAnalyticsSkeleton = () => {
	return createAdminEndpointSkeleton({
		area: "Analytics",
		api: "Sales analytics",
		method: "GET",
		path: "/admin/analytics/sales",
		businessMeaning:
			"Admin sees sales, paid orders, failed payments, and revenue trends.",
		dataSource: ["purchase_order", "purchase_order_item", "payment", "course"],
		futureLogic: [
			"Calculate revenue by period.",
			"Return best-selling courses and failed payment counts.",
		],
	});
};

export const getCompletionAnalyticsSkeleton = () => {
	return createAdminEndpointSkeleton({
		area: "Analytics",
		api: "Completion analytics",
		method: "GET",
		path: "/admin/analytics/completion",
		businessMeaning:
			"Admin sees if students finish courses after buying them.",
		dataSource: ["enrollment", "lesson_progress", "lesson", "course"],
		futureLogic: [
			"Calculate completion rate by course.",
			"Calculate lesson progress and drop-off points.",
		],
	});
};
