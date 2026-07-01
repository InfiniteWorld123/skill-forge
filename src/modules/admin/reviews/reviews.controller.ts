import { sValidator } from "@hono/standard-validator";
import { createFactory } from "hono/factory";
import { jsonOk } from "../../../shared/utils/json-response.js";
import {
	getReviewDetailsService,
	getReviewsSummaryService,
	listReviewsService,
} from "./reviews.service.js";
import { validationError } from "./reviews.utils.js";
import {
	getReviewDetailsParamsSchema,
	getReviewsSummaryQuerySchema,
	listReviewsQuerySchema,
} from "./reviews.validation.js";

const factory = createFactory();

// Business: admin can read student course feedback.
export const listReviews = factory.createHandlers(
	sValidator("query", listReviewsQuerySchema, (result, c) => {
		if (!result.success) return validationError(result, c);
	}),
	async (c) => {
		const data = await listReviewsService(c.req.valid("query"));

		return jsonOk({
			c,
			message: "Reviews",
			data,
		});
	},
);

// Business: admin can see course quality numbers.
export const getReviewsSummary = factory.createHandlers(
	sValidator("query", getReviewsSummaryQuerySchema, (result, c) => {
		if (!result.success) return validationError(result, c);
	}),
	async (c) => {
		const data = await getReviewsSummaryService(c.req.valid("query"));

		return jsonOk({
			c,
			message: "Reviews summary",
			data,
		});
	},
);

// Business: admin can inspect one review.
export const getReviewDetails = factory.createHandlers(
	sValidator("param", getReviewDetailsParamsSchema, (result, c) => {
		if (!result.success) return validationError(result, c);
	}),
	async (c) => {
		const { reviewId } = c.req.valid("param");
		const data = await getReviewDetailsService(reviewId);

		return jsonOk({
			c,
			message: "Review details",
			data,
		});
	},
);
