import { createFactory } from "hono/factory";
import { jsonOk } from "../../../shared/utils/json-response.js";
import {
	getCompletionAnalyticsSkeleton,
	getCourseAnalyticsSkeleton,
	getSalesAnalyticsSkeleton,
	getUserAnalyticsSkeleton,
} from "./analytics.service.js";

const factory = createFactory();

// Business: admin can see user growth.
export const getUserAnalytics = factory.createHandlers(async (c) => {
	return jsonOk({
		c,
		message: "User analytics skeleton",
		data: getUserAnalyticsSkeleton(),
	});
});

// Business: admin can see course performance.
export const getCourseAnalytics = factory.createHandlers(async (c) => {
	return jsonOk({
		c,
		message: "Course analytics skeleton",
		data: getCourseAnalyticsSkeleton(),
	});
});

// Business: admin can see sales performance.
export const getSalesAnalytics = factory.createHandlers(async (c) => {
	return jsonOk({
		c,
		message: "Sales analytics skeleton",
		data: getSalesAnalyticsSkeleton(),
	});
});

// Business: admin can see if students finish courses.
export const getCompletionAnalytics = factory.createHandlers(async (c) => {
	return jsonOk({
		c,
		message: "Completion analytics skeleton",
		data: getCompletionAnalyticsSkeleton(),
	});
});
