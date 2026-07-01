import * as v from "valibot";

const trimmedString = v.pipe(v.string(), v.trim());

const dateString = v.pipe(
	trimmedString,
	v.regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD format"),
);

const positiveNumberString = (name: string, max: number) =>
	v.pipe(
		trimmedString,
		v.regex(/^\d+$/, `${name} must be a number`),
		v.check((value) => Number(value) >= 1, `${name} must be at least 1`),
		v.check((value) => Number(value) <= max, `${name} must be at most ${max}`),
	);

const dateRangeIsValid = <T extends { from?: string; to?: string }>(query: T) => {
	if (!query.from || !query.to) return true;

	return query.from <= query.to;
};

const orderStatus = v.union([
	v.literal("pending"),
	v.literal("paid"),
	v.literal("failed"),
	v.literal("refunded"),
]);

const paymentProvider = v.union([
	v.literal("stripe"),
	v.literal("paypal"),
	v.literal("sepa_bank_transfer"),
	v.literal("bank_transfer"),
]);

const paymentStatus = v.union([
	v.literal("pending"),
	v.literal("succeeded"),
	v.literal("failed"),
	v.literal("refunded"),
]);

const currency = v.union([v.literal("EUR"), v.literal("USD")]);

const period = v.union([
	v.literal("day"),
	v.literal("week"),
	v.literal("month"),
]);

const orderSortBy = v.union([
	v.literal("createdAt"),
	v.literal("updatedAt"),
	v.literal("paidAt"),
	v.literal("totalCents"),
]);

const sortOrder = v.union([v.literal("asc"), v.literal("desc")]);

const queryDateRangeMessage = "From date must be before or equal to to date";

export const listOrdersQuerySchema = v.pipe(
	v.object({
		status: v.optional(orderStatus),
		userId: v.optional(v.pipe(trimmedString, v.minLength(1))),
		currency: v.optional(currency),
		from: v.optional(dateString),
		to: v.optional(dateString),
		page: v.optional(positiveNumberString("Page", 100_000)),
		limit: v.optional(positiveNumberString("Limit", 100)),
		sortBy: v.optional(orderSortBy),
		sortOrder: v.optional(sortOrder),
	}),
	v.check(dateRangeIsValid, queryDateRangeMessage),
);

export const listPaymentsQuerySchema = v.pipe(
	v.object({
		provider: v.optional(paymentProvider),
		status: v.optional(paymentStatus),
		from: v.optional(dateString),
		to: v.optional(dateString),
		page: v.optional(positiveNumberString("Page", 100_000)),
		limit: v.optional(positiveNumberString("Limit", 100)),
	}),
	v.check(dateRangeIsValid, queryDateRangeMessage),
);

export const getRevenueSummaryQuerySchema = v.pipe(
	v.object({
		from: v.optional(dateString),
		to: v.optional(dateString),
		period: v.optional(period),
	}),
	v.check(dateRangeIsValid, queryDateRangeMessage),
);

export const getOrderDetailsParamsSchema = v.object({
	orderId: v.pipe(trimmedString, v.uuid("Order id must be a valid UUID")),
});

export type ListOrdersQuery = v.InferOutput<typeof listOrdersQuerySchema>;
export type ListPaymentsQuery = v.InferOutput<typeof listPaymentsQuerySchema>;
export type GetRevenueSummaryQuery = v.InferOutput<
	typeof getRevenueSummaryQuerySchema
>;
export type GetOrderDetailsParams = v.InferOutput<
	typeof getOrderDetailsParamsSchema
>;
