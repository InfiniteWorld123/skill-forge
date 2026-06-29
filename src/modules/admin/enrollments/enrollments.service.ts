import { createAdminEndpointSkeleton } from "../admin.service.js";

export const listEnrollmentsSkeleton = () => {
	return createAdminEndpointSkeleton({
		area: "Enrollments",
		api: "List enrollments",
		method: "GET",
		path: "/admin/enrollments",
		businessMeaning:
			"Admin sees which users have access to which courses.",
		dataSource: ["enrollment", "user", "course", "purchase_order_item"],
		futureLogic: [
			"Return enrollments with student, course, status, enrolled date, and completed date.",
			"Support status, course, user, and date filters.",
		],
	});
};

export const getEnrollmentDetailsSkeleton = () => {
	return createAdminEndpointSkeleton({
		area: "Enrollments",
		api: "Enrollment details",
		method: "GET",
		path: "/admin/enrollments/:enrollmentId",
		businessMeaning:
			"Admin sees one enrollment with progress, course, student, order item, and certificate.",
		dataSource: [
			"enrollment",
			"user",
			"course",
			"lesson_progress",
			"certificate",
		],
		futureLogic: [
			"Load one enrollment and all completed lessons.",
			"Show if the student finished the course.",
		],
	});
};

export const updateEnrollmentStatusSkeleton = () => {
	return createAdminEndpointSkeleton({
		area: "Enrollments",
		api: "Update enrollment status",
		method: "PATCH",
		path: "/admin/enrollments/:enrollmentId/status",
		businessMeaning:
			"Admin can activate, complete, refund, or revoke course access.",
		dataSource: ["enrollment"],
		futureLogic: [
			"Validate the new enrollment status.",
			"Update enrollment.status and completedAt when needed.",
		],
	});
};
