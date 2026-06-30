import * as v from "valibot";

const analyticsDateString = v.pipe(
	v.string(),
	v.trim(),
	v.regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD format"),
);

const analyticsPeriod = v.union([
	v.literal("day"),
	v.literal("week"),
	v.literal("month"),
]);

const analyticsLimit = v.pipe(
	v.string(),
	v.trim(),
	v.regex(/^\d+$/, "Limit must be a number"),
);

// query schemas
export const getUserAnalyticsQuerySchema = v.object({
	from: v.optional(analyticsDateString),
	to: v.optional(analyticsDateString),
	period: v.optional(analyticsPeriod),
});

export const getCourseAnalyticsQuerySchema = v.object({
	from: v.optional(analyticsDateString),
	to: v.optional(analyticsDateString),
	period: v.optional(analyticsPeriod),
	limit: v.optional(analyticsLimit),
});

export const getSalesAnalyticsQuerySchema = v.object({
	from: v.optional(analyticsDateString),
	to: v.optional(analyticsDateString),
	period: v.optional(analyticsPeriod),
	limit: v.optional(analyticsLimit),
});

export const getCompletionAnalyticsQuerySchema = v.object({
	from: v.optional(analyticsDateString),
	to: v.optional(analyticsDateString),
	period: v.optional(analyticsPeriod),
	limit: v.optional(analyticsLimit),
});

// query Types
export type GetUserAnalyticsQueryType = v.InferOutput<
	typeof getUserAnalyticsQuerySchema
>;

export type GetCourseAnalyticsQueryType = v.InferOutput<
	typeof getCourseAnalyticsQuerySchema
>;

export type GetSalesAnalyticsQueryType = v.InferOutput<
	typeof getSalesAnalyticsQuerySchema
>;

export type GetCompletionAnalyticsQueryType = v.InferOutput<
	typeof getCompletionAnalyticsQuerySchema
>;
