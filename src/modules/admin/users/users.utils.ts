import type { Context } from "hono";
import { asc, desc, type SQL } from "drizzle-orm";
import { user } from "../../../db/schemas/schema.js";
import type {
	GetUserActivityQuery,
	ListUsersQuery,
} from "./users.validation.js";

type PaginationInput = {
	limit?: string;
	offset?: string;
};

type PaginationOutput = {
	total: number;
	limit: number;
	offset: number;
	hasNextPage: boolean;
	hasPreviousPage: boolean;
};

export type UserActivityItem = {
	type: "order" | "enrollment" | "review" | "question" | "certificate";
	occurredAt: Date;
	data: Record<string, unknown>;
};

export const validationError = (
	result: { success: false; error: unknown },
	c: Context,
) => {
	return c.json({ success: false, errors: result.error }, 400);
};

export const getPagination = (query: PaginationInput) => {
	return {
		limit: query.limit ? Number(query.limit) : 20,
		offset: query.offset ? Number(query.offset) : 0,
	};
};

export const getActivityLimit = (query: GetUserActivityQuery) => {
	return query.limit ? Number(query.limit) : 30;
};

export const getPaginations = ({
	total,
	limit,
	offset,
	itemCount,
}: {
	total: number;
	limit: number;
	offset: number;
	itemCount: number;
}): PaginationOutput => {
	return {
		total,
		limit,
		offset,
		hasNextPage: offset + itemCount < total,
		hasPreviousPage: offset > 0,
	};
};

export const getDateRangeValues = (query: Pick<ListUsersQuery, "from" | "to">) => {
	return {
		from: query.from ? new Date(`${query.from}T00:00:00.000Z`) : undefined,
		to: query.to ? new Date(`${query.to}T23:59:59.999Z`) : undefined,
	};
};

export const getListUsersSort = (
	sortBy: ListUsersQuery["sortBy"] = "createdAt",
	sortDirection: ListUsersQuery["sortDirection"] = "desc",
	enrollmentCount: SQL<number>,
	orderCount: SQL<number>,
) => {
	const columns = {
		createdAt: user.createdAt,
		updatedAt: user.updatedAt,
		name: user.name,
		email: user.email,
		role: user.role,
		banned: user.banned,
		enrollmentCount,
		orderCount,
	};

	const column = columns[sortBy];

	return sortDirection === "asc" ? asc(column) : desc(column);
};

export const normalizeOrderActivity = (order: {
	id: string;
	status: string;
	totalCents: number;
	currency: string;
	createdAt: Date;
	paidAt: Date | null;
	refundedAt: Date | null;
}): UserActivityItem => ({
	type: "order",
	occurredAt: order.createdAt,
	data: order,
});

export const normalizeEnrollmentActivity = (item: {
	id: string;
	status: string;
	enrolledAt: Date;
	completedAt: Date | null;
	course: {
		id: string;
		title: string;
		slug: string;
		status: string;
	};
}): UserActivityItem => ({
	type: "enrollment",
	occurredAt: item.enrolledAt,
	data: item,
});

export const normalizeReviewActivity = (item: {
	id: string;
	rating: number;
	title: string | null;
	body: string | null;
	createdAt: Date;
	course: {
		id: string;
		title: string;
		slug: string;
		status: string;
	};
}): UserActivityItem => ({
	type: "review",
	occurredAt: item.createdAt,
	data: item,
});

export const normalizeQuestionActivity = (item: {
	id: string;
	lessonId: string;
	status: string;
	title: string;
	body: string;
	createdAt: Date;
	updatedAt: Date;
}): UserActivityItem => ({
	type: "question",
	occurredAt: item.createdAt,
	data: item,
});

export const normalizeCertificateActivity = (item: {
	id: string;
	enrollmentId: string;
	certificateCode: string;
	issuedAt: Date;
	course: {
		id: string;
		title: string;
		slug: string;
		status: string;
	};
}): UserActivityItem => ({
	type: "certificate",
	occurredAt: item.issuedAt,
	data: item,
});

export const sortAndLimitActivity = (
	items: UserActivityItem[],
	limit: number,
) => {
	return items
		.sort((left, right) => right.occurredAt.getTime() - left.occurredAt.getTime())
		.slice(0, limit);
};
