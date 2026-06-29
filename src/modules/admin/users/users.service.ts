import { createAdminEndpointSkeleton } from "../admin.service.js";

export const listUsersSkeleton = () => {
	return createAdminEndpointSkeleton({
		area: "Users",
		api: "List users",
		method: "GET",
		path: "/admin/users",
		businessMeaning:
			"Admin sees all people using the platform and can search or filter them.",
		dataSource: ["user", "student_profile", "teacher_profile", "enrollment"],
		futureLogic: [
			"Return users with profile flags, signup date, and learning or teaching status.",
			"Support filters like search, email verified, teacher, and created date.",
		],
	});
};

export const getUserDetailsSkeleton = () => {
	return createAdminEndpointSkeleton({
		area: "Users",
		api: "User details",
		method: "GET",
		path: "/admin/users/:userId",
		businessMeaning:
			"Admin sees one user account with profile, orders, enrollments, reviews, and certificates.",
		dataSource: [
			"user",
			"student_profile",
			"teacher_profile",
			"purchase_order",
			"enrollment",
			"course_review",
			"certificate",
		],
		futureLogic: [
			"Load the auth account and related business records.",
			"Show a complete support view for one user.",
		],
	});
};

export const getUserActivitySkeleton = () => {
	return createAdminEndpointSkeleton({
		area: "Users",
		api: "User activity",
		method: "GET",
		path: "/admin/users/:userId/activity",
		businessMeaning:
			"Admin sees what one user did on the platform over time.",
		dataSource: [
			"purchase_order",
			"enrollment",
			"lesson_progress",
			"course_review",
			"lesson_question",
			"lesson_answer",
		],
		futureLogic: [
			"Build a timeline of orders, enrollments, completed lessons, reviews, and Q&A.",
			"Sort newest activity first.",
		],
	});
};
