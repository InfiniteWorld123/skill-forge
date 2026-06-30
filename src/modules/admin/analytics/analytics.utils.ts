import type { Context } from "hono";
import type {
	GetCompletionAnalyticsQueryType,
	GetCourseAnalyticsQueryType,
	GetSalesAnalyticsQueryType,
	GetUserAnalyticsQueryType,
} from "./analytics.validation.js";

type AnalyticsQuery =
	| GetUserAnalyticsQueryType
	| GetCourseAnalyticsQueryType
	| GetSalesAnalyticsQueryType
	| GetCompletionAnalyticsQueryType;

export const validationError = (
	result: { success: false; error: unknown },
	c: Context,
) => {
	return c.json({ success: false, errors: result.error }, 400);
};

export const getAnalyticsDateRange = (query: AnalyticsQuery) => {
	const now = new Date();
	const defaultFrom = new Date(now);

	defaultFrom.setDate(defaultFrom.getDate() - 30);

	const from = query.from ? new Date(query.from) : defaultFrom;
	const to = query.to ? new Date(query.to) : now;

	if (query.from) from.setHours(0, 0, 0, 0);
	if (query.to) to.setHours(23, 59, 59, 999);

	return {
		from,
		to,
		period: query.period ?? "day",
	};
};

export const getAnalyticsLimit = (
	query:
		| GetCourseAnalyticsQueryType
		| GetSalesAnalyticsQueryType
		| GetCompletionAnalyticsQueryType,
) => {
	const limit = query.limit ? Number(query.limit) : 10;

	return Math.min(Math.max(limit, 1), 50);
};

export const getUserAnalyticsDateRange = getAnalyticsDateRange;
