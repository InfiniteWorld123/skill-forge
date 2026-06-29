import { createAdminEndpointSkeleton } from "../admin.service.js";

export const getDashboardOverviewSkeleton = () => {
	return createAdminEndpointSkeleton({
		area: "Dashboard",
		api: "Dashboard overview",
		method: "GET",
		path: "/admin/dashboard/overview",
		businessMeaning:
			"Admin sees the main numbers of the platform in one place.",
		dataSource: [
			"user",
			"teacher_profile",
			"course",
			"purchase_order",
			"enrollment",
			"course_review",
		],
		futureLogic: [
			"Count users, teachers, courses, paid orders, enrollments, and reviews.",
			"Calculate total revenue and average rating.",
		],
	});
};

export const getRecentActivitySkeleton = () => {
	return createAdminEndpointSkeleton({
		area: "Dashboard",
		api: "Recent activity",
		method: "GET",
		path: "/admin/dashboard/recent-activity",
		businessMeaning:
			"Admin sees what happened recently, like new users, orders, reviews, and questions.",
		dataSource: [
			"user",
			"course",
			"purchase_order",
			"enrollment",
			"course_review",
			"lesson_question",
			"certificate",
		],
		futureLogic: [
			"Return the newest important records from the platform.",
			"Group activities by type so the frontend can show an activity feed.",
		],
	});
};

export const getDashboardChartsSkeleton = () => {
	return createAdminEndpointSkeleton({
		area: "Dashboard",
		api: "Dashboard charts",
		method: "GET",
		path: "/admin/dashboard/charts",
		businessMeaning:
			"Admin sees simple charts for growth, sales, enrollments, and course publishing.",
		dataSource: ["user", "course", "purchase_order", "enrollment"],
		futureLogic: [
			"Group signups, revenue, enrollments, and published courses by day or month.",
			"Return chart-ready arrays for the admin frontend.",
		],
	});
};
