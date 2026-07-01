import type { Context } from "hono";
import type {
	GetDashboardChartsQuery,
	GetRecentActivityQuery,
} from "./dashboard.validation.js";

export type DashboardActivityType =
	| "user_registered"
	| "teacher_created"
	| "course_created"
	| "course_published"
	| "order_paid"
	| "payment_failed"
	| "enrollment_created"
	| "enrollment_completed"
	| "review_created"
	| "question_created"
	| "certificate_issued";

export type DashboardActivity = {
	id: string;
	type: DashboardActivityType;
	occurredAt: Date;
	title: string;
	description: string;
	actor: {
		id: string;
		name: string;
		email: string;
		image: string | null;
	} | null;
	target: {
		id: string;
		type: string;
		label: string;
	} | null;
	metadata?: Record<string, unknown>;
};

type CourseChartRow = {
	period: string;
	count: number;
};

export const validationError = (
	result: { success: false; error: unknown },
	c: Context,
) => {
	return c.json({ success: false, errors: result.error }, 400);
};

export const getDashboardDateRange = (query: GetDashboardChartsQuery) => {
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

export const getLast30DaysRange = () => {
	const to = new Date();
	const from = new Date(to);

	from.setDate(from.getDate() - 30);

	return { from, to };
};

export const getRecentActivityLimit = (query: GetRecentActivityQuery) => {
	const limit = query.limit ? Number(query.limit) : 20;

	return Math.min(Math.max(limit, 1), 50);
};

export const getCompletionRate = ({
	completed,
	total,
}: {
	completed: number;
	total: number;
}) => {
	if (total === 0) return 0;

	return Math.round((completed / total) * 10000) / 100;
};

export const buildDashboardActivity = (
	activity: DashboardActivity,
): DashboardActivity => activity;

export const sortDashboardActivities = (
	activities: DashboardActivity[],
	limit: number,
) => {
	return activities
		.sort((first, second) => {
			return second.occurredAt.getTime() - first.occurredAt.getTime();
		})
		.slice(0, limit);
};

export const mergeCourseChartRows = ({
	createdRows,
	publishedRows,
}: {
	createdRows: CourseChartRow[];
	publishedRows: CourseChartRow[];
}) => {
	const rowsByPeriod = new Map<string, { period: string; created: number; published: number }>();

	for (const row of createdRows) {
		rowsByPeriod.set(row.period, {
			period: row.period,
			created: row.count,
			published: 0,
		});
	}

	for (const row of publishedRows) {
		const existing = rowsByPeriod.get(row.period);

		rowsByPeriod.set(row.period, {
			period: row.period,
			created: existing?.created ?? 0,
			published: row.count,
		});
	}

	return [...rowsByPeriod.values()].sort((first, second) => {
		return first.period.localeCompare(second.period);
	});
};
