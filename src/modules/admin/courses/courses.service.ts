import { createAdminEndpointSkeleton } from "../admin.service.js";

export const listCoursesSkeleton = () => {
	return createAdminEndpointSkeleton({
		area: "Courses",
		api: "List courses",
		method: "GET",
		path: "/admin/courses",
		businessMeaning:
			"Admin sees the course catalog and can filter by status, category, level, teacher, and price.",
		dataSource: ["course", "teacher_profile", "course_category", "course_review"],
		futureLogic: [
			"Return courses with teacher, category, status, price, rating, and enrollment count.",
			"Support filters for catalog management.",
		],
	});
};

export const getCourseDetailsSkeleton = () => {
	return createAdminEndpointSkeleton({
		area: "Courses",
		api: "Course details",
		method: "GET",
		path: "/admin/courses/:courseId",
		businessMeaning:
			"Admin sees one course with content, teacher, sales, students, reviews, and questions.",
		dataSource: [
			"course",
			"teacher_profile",
			"course_category",
			"course_tag",
			"course_section",
			"lesson",
			"enrollment",
			"course_review",
			"lesson_question",
		],
		futureLogic: [
			"Load one course with all important admin details.",
			"Show if the course is ready, useful, and selling.",
		],
	});
};

export const updateCourseSkeleton = () => {
	return createAdminEndpointSkeleton({
		area: "Courses",
		api: "Update course",
		method: "PATCH",
		path: "/admin/courses/:courseId",
		businessMeaning:
			"Admin can fix important course catalog fields like title, category, price, level, and language.",
		dataSource: ["course", "course_tag"],
		futureLogic: [
			"Validate editable course fields.",
			"Update the course record and maybe course tags.",
		],
	});
};

export const updateCourseStatusSkeleton = () => {
	return createAdminEndpointSkeleton({
		area: "Courses",
		api: "Update course status",
		method: "PATCH",
		path: "/admin/courses/:courseId/status",
		businessMeaning:
			"Admin can publish, draft, or archive a course.",
		dataSource: ["course"],
		futureLogic: [
			"Validate the new status.",
			"Update status, publishedAt, or archivedAt.",
		],
	});
};

export const getCourseCurriculumSkeleton = () => {
	return createAdminEndpointSkeleton({
		area: "Courses",
		api: "Course curriculum",
		method: "GET",
		path: "/admin/courses/:courseId/curriculum",
		businessMeaning:
			"Admin reviews the course sections, lessons, and quiz questions.",
		dataSource: ["course_section", "lesson", "quiz_question", "quiz_option"],
		futureLogic: [
			"Return sections in order with lessons and quiz data.",
			"Help admin check course quality.",
		],
	});
};

export const getCoursePerformanceSkeleton = () => {
	return createAdminEndpointSkeleton({
		area: "Courses",
		api: "Course performance",
		method: "GET",
		path: "/admin/courses/:courseId/performance",
		businessMeaning:
			"Admin sees if one course is selling and if students complete it.",
		dataSource: [
			"purchase_order_item",
			"enrollment",
			"lesson_progress",
			"course_review",
			"wishlist_item",
		],
		futureLogic: [
			"Calculate revenue, enrollments, completion rate, average rating, and wishlist count.",
			"Show lesson drop-off when progress logic is ready.",
		],
	});
};
