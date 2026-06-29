import { createAdminEndpointSkeleton } from "../admin.service.js";

export const listTeachersSkeleton = () => {
	return createAdminEndpointSkeleton({
		area: "Teachers",
		api: "List teachers",
		method: "GET",
		path: "/admin/teachers",
		businessMeaning:
			"Admin sees who is teaching, how many courses they have, and how they perform.",
		dataSource: [
			"teacher_profile",
			"user",
			"course",
			"enrollment",
			"purchase_order_item",
			"course_review",
		],
		futureLogic: [
			"Return teachers with course count, student count, revenue, and average rating.",
			"Support search and public/private profile filters.",
		],
	});
};

export const getTeacherDetailsSkeleton = () => {
	return createAdminEndpointSkeleton({
		area: "Teachers",
		api: "Teacher details",
		method: "GET",
		path: "/admin/teachers/:teacherProfileId",
		businessMeaning:
			"Admin sees one teacher profile, courses, revenue, reviews, and Q&A activity.",
		dataSource: [
			"teacher_profile",
			"user",
			"course",
			"purchase_order_item",
			"course_review",
			"lesson_question",
			"lesson_answer",
		],
		futureLogic: [
			"Load teacher profile with all teaching-related platform data.",
			"Show if this teacher is valuable and active.",
		],
	});
};

export const updateTeacherVisibilitySkeleton = () => {
	return createAdminEndpointSkeleton({
		area: "Teachers",
		api: "Update teacher visibility",
		method: "PATCH",
		path: "/admin/teachers/:teacherProfileId/visibility",
		businessMeaning:
			"Admin can make a teacher profile public or private.",
		dataSource: ["teacher_profile"],
		futureLogic: [
			"Validate the teacherProfileId param.",
			"Update teacher_profile.is_public.",
		],
	});
};
