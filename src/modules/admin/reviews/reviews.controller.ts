import { createFactory } from "hono/factory";
import { jsonOk } from "../../../shared/utils/json-response.js";
import {
	getReviewDetailsSkeleton,
	getReviewsSummarySkeleton,
	listReviewsSkeleton,
} from "./reviews.service.js";

const factory = createFactory();

// Business: admin can read student course feedback.
export const listReviews = factory.createHandlers(async (c) => {
	return jsonOk({
		c,
		message: "List reviews skeleton",
		data: listReviewsSkeleton(),
	});
});

// Business: admin can see course quality numbers.
export const getReviewsSummary = factory.createHandlers(async (c) => {
	return jsonOk({
		c,
		message: "Reviews summary skeleton",
		data: getReviewsSummarySkeleton(),
	});
});

// Business: admin can inspect one review.
export const getReviewDetails = factory.createHandlers(async (c) => {
	return jsonOk({
		c,
		message: "Review details skeleton",
		data: getReviewDetailsSkeleton(),
	});
});
