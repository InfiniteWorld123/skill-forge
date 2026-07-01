import * as v from "valibot";

const dashboardDateString = v.pipe(
	v.string(),
	v.trim(),
	v.regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD format"),
);

const dashboardPeriod = v.union([
	v.literal("day"),
	v.literal("week"),
	v.literal("month"),
]);

const dashboardLimit = v.pipe(
	v.string(),
	v.trim(),
	v.regex(/^\d+$/, "Limit must be a number"),
);

export const getRecentActivityQuerySchema = v.object({
	limit: v.optional(dashboardLimit),
});

export const getDashboardChartsQuerySchema = v.object({
	from: v.optional(dashboardDateString),
	to: v.optional(dashboardDateString),
	period: v.optional(dashboardPeriod),
});

export type GetRecentActivityQuery = v.InferOutput<
	typeof getRecentActivityQuerySchema
>;

export type GetDashboardChartsQuery = v.InferOutput<
	typeof getDashboardChartsQuerySchema
>;
