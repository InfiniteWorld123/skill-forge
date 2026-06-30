import { createFactory } from "hono/factory";
import { jsonOk } from "../../../shared/utils/json-response.js";
import {
	getCompletionAnalyticsService,
	getCourseAnalyticsService,
	getSalesAnalyticsService,
	getUserAnalyticsService,
} from "./analytics.service.js";
import { sValidator } from "@hono/standard-validator";
import {
	getCompletionAnalyticsQuerySchema,
	getCourseAnalyticsQuerySchema,
	getSalesAnalyticsQuerySchema,
	getUserAnalyticsQuerySchema,
} from "./analytics.validation.js";
import { validationError } from "./analytics.utils.js";

const factory = createFactory();

export const getUserAnalytics = factory.createHandlers(
	sValidator("query", getUserAnalyticsQuerySchema, (result, c) => {
		if (!result.success) return validationError(result, c);
	}),
	async (c) => {
		const data = await getUserAnalyticsService(c.req.valid("query"));

		return jsonOk({
			c,
			message: "User analytics",
			data,
		});
	},
);

// Business: admin can see course performance.
export const getCourseAnalytics = factory.createHandlers(
	sValidator("query", getCourseAnalyticsQuerySchema, (result, c) => {
		if (!result.success) return validationError(result, c);
	}),
	async (c) => {
		const data = await getCourseAnalyticsService(c.req.valid("query"));

		return jsonOk({
			c,
			message: "Course analytics",
			data,
		});
	},
);

// Business: admin can see sales performance.
export const getSalesAnalytics = factory.createHandlers(
	sValidator("query", getSalesAnalyticsQuerySchema, (result, c) => {
		if (!result.success) return validationError(result, c);
	}),
	async (c) => {
		const data = await getSalesAnalyticsService(c.req.valid("query"));

		return jsonOk({
			c,
			message: "Sales analytics",
			data,
		});
	},
);

// Business: admin can see if students finish courses.
export const getCompletionAnalytics = factory.createHandlers(
	sValidator("query", getCompletionAnalyticsQuerySchema, (result, c) => {
		if (!result.success) return validationError(result, c);
	}),
	async (c) => {
		const data = await getCompletionAnalyticsService(c.req.valid("query"));

		return jsonOk({
			c,
			message: "Completion analytics",
			data,
		});
	},
);
