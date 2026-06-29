import { createAdminEndpointSkeleton } from "../admin.service.js";

export const listReviewsSkeleton = () => {
	return createAdminEndpointSkeleton({
		area: "Reviews",
		api: "List reviews",
		method: "GET",
		path: "/admin/reviews",
		businessMeaning:
			"Admin sees what students say about courses.",
		dataSource: ["course_review", "user", "course", "enrollment"],
		futureLogic: [
			"Return reviews with student, course, rating, title, body, and date.",
			"Support filters by rating, course, user, and date.",
		],
	});
};

export const getReviewsSummarySkeleton = () => {
	return createAdminEndpointSkeleton({
		area: "Reviews",
		api: "Reviews summary",
		method: "GET",
		path: "/admin/reviews/summary",
		businessMeaning:
			"Admin sees course quality signals like average rating and low-rated courses.",
		dataSource: ["course_review", "course"],
		futureLogic: [
			"Calculate average rating per course.",
			"Return newest reviews and lowest-rated courses.",
		],
	});
};

export const getReviewDetailsSkeleton = () => {
	return createAdminEndpointSkeleton({
		area: "Reviews",
		api: "Review details",
		method: "GET",
		path: "/admin/reviews/:reviewId",
		businessMeaning:
			"Admin sees one review with student, course, and enrollment context.",
		dataSource: ["course_review", "user", "course", "enrollment"],
		futureLogic: [
			"Load one review and related records.",
			"Keep reviews read-only until the database has a review_status column.",
		],
	});
};
