import type { Context } from "hono";
import { asc, desc, type SQLWrapper } from "drizzle-orm";
import { purchaseOrder } from "../../../db/schemas/schema.js";
import type {
	GetRevenueSummaryQuery,
	ListOrdersQuery,
	ListPaymentsQuery,
} from "./orders.validation.js";

type DateRangeQuery = Pick<GetRevenueSummaryQuery, "from" | "to" | "period">;

export const validationError = (
	result: { success: boolean; error?: unknown },
	c: Context,
) => {
	return c.json({ success: false, errors: result.error }, 400);
};

export const getDateRange = (query: DateRangeQuery) => {
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

export const getPagination = (
	query: Pick<ListOrdersQuery | ListPaymentsQuery, "page" | "limit">,
) => {
	const page = query.page ? Number(query.page) : 1;
	const limit = query.limit ? Number(query.limit) : 20;

	return {
		page,
		limit,
		offset: (page - 1) * limit,
	};
};

export const getPaginationMeta = ({
	page,
	limit,
	total,
}: {
	page: number;
	limit: number;
	total: number;
}) => {
	const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

	return {
		page,
		limit,
		total,
		totalPages,
		hasNext: page * limit < total,
		hasBefore: page > 1,
	};
};

export const getOrderSort = (
	sortBy: ListOrdersQuery["sortBy"] = "createdAt",
	sortOrder: ListOrdersQuery["sortOrder"] = "desc",
) => {
	const columns: Record<NonNullable<ListOrdersQuery["sortBy"]>, SQLWrapper> = {
		createdAt: purchaseOrder.createdAt,
		updatedAt: purchaseOrder.updatedAt,
		paidAt: purchaseOrder.paidAt,
		totalCents: purchaseOrder.totalCents,
	};

	const column = columns[sortBy];

	return sortOrder === "asc" ? asc(column) : desc(column);
};
