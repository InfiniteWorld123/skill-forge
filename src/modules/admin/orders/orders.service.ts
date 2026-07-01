import {
	and,
	count,
	desc,
	eq,
	gte,
	inArray,
	lte,
	sql,
	type SQLWrapper,
} from "drizzle-orm";
import { db } from "../../../db/db.js";
import {
	course,
	enrollment,
	payment,
	purchaseOrder,
	purchaseOrderItem,
	user,
} from "../../../db/schemas/schema.js";
import { notFoundError } from "../../../shared/constants/errors.js";
import type {
	GetRevenueSummaryQuery,
	ListOrdersQuery,
	ListPaymentsQuery,
} from "./orders.validation.js";
import {
	getDateRange,
	getOrderSort,
	getPagination,
	getPaginationMeta,
} from "./orders.utils.js";

const getListOrdersFilters = (query: ListOrdersQuery, from: Date, to: Date) => {
	const filters: SQLWrapper[] = [
		gte(purchaseOrder.createdAt, from),
		lte(purchaseOrder.createdAt, to),
	];

	if (query.status) filters.push(eq(purchaseOrder.status, query.status));
	if (query.userId) filters.push(eq(purchaseOrder.userId, query.userId));
	if (query.currency) filters.push(eq(purchaseOrder.currency, query.currency));

	return and(...filters);
};

const getListPaymentsFilters = (
	query: ListPaymentsQuery,
	from: Date,
	to: Date,
) => {
	const filters: SQLWrapper[] = [
		gte(payment.createdAt, from),
		lte(payment.createdAt, to),
	];

	if (query.provider) filters.push(eq(payment.provider, query.provider));
	if (query.status) filters.push(eq(payment.status, query.status));

	return and(...filters);
};

const getOrderStatusCounts = async (from: Date, to: Date) => {
	const rows = await db
		.select({
			status: purchaseOrder.status,
			count: count(),
		})
		.from(purchaseOrder)
		.where(and(gte(purchaseOrder.createdAt, from), lte(purchaseOrder.createdAt, to)))
		.groupBy(purchaseOrder.status);

	const statusCounts = {
		pending: 0,
		paid: 0,
		failed: 0,
		refunded: 0,
	};

	for (const row of rows) {
		statusCounts[row.status] = row.count;
	}

	return statusCounts;
};

export const listOrdersService = async (query: ListOrdersQuery) => {
	const { page, limit, offset } = getPagination(query);
	const { from, to } = getDateRange(query);
	const where = getListOrdersFilters(query, from, to);

	const [totalRow] = await db
		.select({ value: count() })
		.from(purchaseOrder)
		.where(where);

	const orders = await db
		.select({
			id: purchaseOrder.id,
			status: purchaseOrder.status,
			subtotalCents: purchaseOrder.subtotalCents,
			totalCents: purchaseOrder.totalCents,
			currency: purchaseOrder.currency,
			createdAt: purchaseOrder.createdAt,
			updatedAt: purchaseOrder.updatedAt,
			paidAt: purchaseOrder.paidAt,
			refundedAt: purchaseOrder.refundedAt,
			buyerId: user.id,
			buyerName: user.name,
			buyerEmail: user.email,
			itemCount: sql<number>`(
				select count(*)::int
				from ${purchaseOrderItem}
				where ${purchaseOrderItem.orderId} = ${purchaseOrder.id}
			)`,
		})
		.from(purchaseOrder)
		.innerJoin(user, eq(purchaseOrder.userId, user.id))
		.where(where)
		.orderBy(getOrderSort(query.sortBy, query.sortOrder), desc(purchaseOrder.id))
		.limit(limit)
		.offset(offset);

	const orderIds = orders.map((order) => order.id);
	const latestPaymentsByOrderId = new Map<string, {
		id: string;
		provider: string;
		status: string;
		amountCents: number;
		currency: string;
		rawProviderStatus: string | null;
		createdAt: Date;
	}>();

	if (orderIds.length > 0) {
		const payments = await db
			.select({
				id: payment.id,
				orderId: payment.orderId,
				provider: payment.provider,
				status: payment.status,
				amountCents: payment.amountCents,
				currency: payment.currency,
				rawProviderStatus: payment.rawProviderStatus,
				createdAt: payment.createdAt,
			})
			.from(payment)
			.where(inArray(payment.orderId, orderIds))
			.orderBy(payment.orderId, desc(payment.createdAt));

		for (const row of payments) {
			if (!latestPaymentsByOrderId.has(row.orderId)) {
				latestPaymentsByOrderId.set(row.orderId, {
					id: row.id,
					provider: row.provider,
					status: row.status,
					amountCents: row.amountCents,
					currency: row.currency,
					rawProviderStatus: row.rawProviderStatus,
					createdAt: row.createdAt,
				});
			}
		}
	}

	return {
		filters: {
			status: query.status ?? null,
			userId: query.userId ?? null,
			currency: query.currency ?? null,
			from: from.toISOString(),
			to: to.toISOString(),
			sortBy: query.sortBy ?? "createdAt",
			sortOrder: query.sortOrder ?? "desc",
		},
		pagination: getPaginationMeta({
			page,
			limit,
			total: totalRow.value,
		}),
		orders: orders.map((order) => ({
			id: order.id,
			status: order.status,
			subtotalCents: order.subtotalCents,
			totalCents: order.totalCents,
			currency: order.currency,
			createdAt: order.createdAt,
			updatedAt: order.updatedAt,
			paidAt: order.paidAt,
			refundedAt: order.refundedAt,
			buyer: {
				id: order.buyerId,
				name: order.buyerName,
				email: order.buyerEmail,
			},
			itemCount: order.itemCount,
			latestPayment: latestPaymentsByOrderId.get(order.id) ?? null,
		})),
	};
};

export const listPaymentsService = async (query: ListPaymentsQuery) => {
	const { page, limit, offset } = getPagination(query);
	const { from, to } = getDateRange(query);
	const where = getListPaymentsFilters(query, from, to);

	const [totalRow] = await db
		.select({ value: count() })
		.from(payment)
		.where(where);

	const payments = await db
		.select({
			id: payment.id,
			provider: payment.provider,
			status: payment.status,
			amountCents: payment.amountCents,
			currency: payment.currency,
			providerCheckoutId: payment.providerCheckoutId,
			providerPaymentId: payment.providerPaymentId,
			providerCustomerId: payment.providerCustomerId,
			rawProviderStatus: payment.rawProviderStatus,
			createdAt: payment.createdAt,
			updatedAt: payment.updatedAt,
			orderId: purchaseOrder.id,
			orderStatus: purchaseOrder.status,
			orderTotalCents: purchaseOrder.totalCents,
			orderCurrency: purchaseOrder.currency,
			orderCreatedAt: purchaseOrder.createdAt,
			orderPaidAt: purchaseOrder.paidAt,
			buyerId: user.id,
			buyerName: user.name,
			buyerEmail: user.email,
		})
		.from(payment)
		.innerJoin(purchaseOrder, eq(payment.orderId, purchaseOrder.id))
		.innerJoin(user, eq(purchaseOrder.userId, user.id))
		.where(where)
		.orderBy(desc(payment.createdAt), desc(payment.id))
		.limit(limit)
		.offset(offset);

	return {
		filters: {
			provider: query.provider ?? null,
			status: query.status ?? null,
			from: from.toISOString(),
			to: to.toISOString(),
		},
		pagination: getPaginationMeta({
			page,
			limit,
			total: totalRow.value,
		}),
		payments: payments.map((row) => ({
			id: row.id,
			provider: row.provider,
			status: row.status,
			amountCents: row.amountCents,
			currency: row.currency,
			providerCheckoutId: row.providerCheckoutId,
			providerPaymentId: row.providerPaymentId,
			providerCustomerId: row.providerCustomerId,
			rawProviderStatus: row.rawProviderStatus,
			createdAt: row.createdAt,
			updatedAt: row.updatedAt,
			order: {
				id: row.orderId,
				status: row.orderStatus,
				totalCents: row.orderTotalCents,
				currency: row.orderCurrency,
				createdAt: row.orderCreatedAt,
				paidAt: row.orderPaidAt,
			},
			buyer: {
				id: row.buyerId,
				name: row.buyerName,
				email: row.buyerEmail,
			},
		})),
	};
};

export const getRevenueSummaryService = async (
	query: GetRevenueSummaryQuery,
) => {
	const { from, to, period } = getDateRange(query);
	const periodSql = sql.raw(`'${period}'`);
	const revenuePeriodExpression = sql<string>`
		date_trunc(${periodSql}, ${purchaseOrder.paidAt})::date
	`;

	const paidAtFilter = and(
		eq(purchaseOrder.status, "paid"),
		gte(purchaseOrder.paidAt, from),
		lte(purchaseOrder.paidAt, to),
	);
	const refundedAtFilter = and(
		eq(purchaseOrder.status, "refunded"),
		gte(purchaseOrder.refundedAt, from),
		lte(purchaseOrder.refundedAt, to),
	);
	const paymentCreatedAtFilter = and(
		gte(payment.createdAt, from),
		lte(payment.createdAt, to),
	);

	const [
		orderStatusCounts,
		[grossRevenue],
		[refundedOrderValue],
		[averageOrderValue],
		[successfulPayments],
		[failedPayments],
		trend,
		byCurrency,
	] = await Promise.all([
		getOrderStatusCounts(from, to),
		db
			.select({
				value: sql<number>`coalesce(sum(${purchaseOrder.totalCents}), 0)::int`,
				orders: count(),
			})
			.from(purchaseOrder)
			.where(paidAtFilter),
		db
			.select({
				value: sql<number>`coalesce(sum(${purchaseOrder.totalCents}), 0)::int`,
				orders: count(),
			})
			.from(purchaseOrder)
			.where(refundedAtFilter),
		db
			.select({
				value: sql<number>`coalesce(avg(${purchaseOrder.totalCents}), 0)::float8`,
			})
			.from(purchaseOrder)
			.where(paidAtFilter),
		db
			.select({ value: count() })
			.from(payment)
			.where(and(eq(payment.status, "succeeded"), paymentCreatedAtFilter)),
		db
			.select({ value: count() })
			.from(payment)
			.where(and(eq(payment.status, "failed"), paymentCreatedAtFilter)),
		db
			.select({
				period: revenuePeriodExpression,
				revenueCents: sql<number>`coalesce(sum(${purchaseOrder.totalCents}), 0)::int`,
				orders: count(),
			})
			.from(purchaseOrder)
			.where(paidAtFilter)
			.groupBy(revenuePeriodExpression)
			.orderBy(revenuePeriodExpression),
		db
			.select({
				currency: purchaseOrder.currency,
				grossRevenueCents: sql<number>`coalesce(sum(${purchaseOrder.totalCents}), 0)::int`,
				paidOrders: count(),
			})
			.from(purchaseOrder)
			.where(paidAtFilter)
			.groupBy(purchaseOrder.currency)
			.orderBy(purchaseOrder.currency),
	]);

	return {
		filters: {
			from: from.toISOString(),
			to: to.toISOString(),
			period,
		},
		summary: {
			grossRevenueCents: grossRevenue.value,
			paidOrders: grossRevenue.orders,
			refundedOrderValueCents: refundedOrderValue.value,
			refundedOrders: refundedOrderValue.orders,
			pendingOrders: orderStatusCounts.pending,
			failedOrders: orderStatusCounts.failed,
			averageOrderValueCents: averageOrderValue.value,
			successfulPayments: successfulPayments.value,
			failedPayments: failedPayments.value,
		},
		trend,
		byCurrency,
	};
};

export const getOrderDetailsService = async (orderId: string) => {
	const [order] = await db
		.select({
			id: purchaseOrder.id,
			status: purchaseOrder.status,
			subtotalCents: purchaseOrder.subtotalCents,
			totalCents: purchaseOrder.totalCents,
			currency: purchaseOrder.currency,
			createdAt: purchaseOrder.createdAt,
			updatedAt: purchaseOrder.updatedAt,
			paidAt: purchaseOrder.paidAt,
			refundedAt: purchaseOrder.refundedAt,
			buyerId: user.id,
			buyerName: user.name,
			buyerEmail: user.email,
			buyerImage: user.image,
			buyerRole: user.role,
		})
		.from(purchaseOrder)
		.innerJoin(user, eq(purchaseOrder.userId, user.id))
		.where(eq(purchaseOrder.id, orderId));

	if (!order) {
		throw notFoundError("Order not found");
	}

	const items = await db
		.select({
			id: purchaseOrderItem.id,
			courseId: purchaseOrderItem.courseId,
			titleSnapshot: purchaseOrderItem.titleSnapshot,
			priceCents: purchaseOrderItem.priceCents,
			currency: purchaseOrderItem.currency,
			createdAt: purchaseOrderItem.createdAt,
			courseIdJoined: course.id,
			courseTitle: course.title,
			courseSlug: course.slug,
			courseStatus: course.status,
		})
		.from(purchaseOrderItem)
		.innerJoin(course, eq(purchaseOrderItem.courseId, course.id))
		.where(eq(purchaseOrderItem.orderId, order.id))
		.orderBy(purchaseOrderItem.createdAt);

	const payments = await db
		.select({
			id: payment.id,
			provider: payment.provider,
			status: payment.status,
			amountCents: payment.amountCents,
			currency: payment.currency,
			providerCheckoutId: payment.providerCheckoutId,
			providerPaymentId: payment.providerPaymentId,
			providerCustomerId: payment.providerCustomerId,
			rawProviderStatus: payment.rawProviderStatus,
			createdAt: payment.createdAt,
			updatedAt: payment.updatedAt,
		})
		.from(payment)
		.where(eq(payment.orderId, order.id))
		.orderBy(desc(payment.createdAt));

	const itemIds = items.map((item) => item.id);
	const enrollments =
		itemIds.length === 0
			? []
			: await db
					.select({
						id: enrollment.id,
						userId: enrollment.userId,
						courseId: enrollment.courseId,
						orderItemId: enrollment.orderItemId,
						status: enrollment.status,
						enrolledAt: enrollment.enrolledAt,
						completedAt: enrollment.completedAt,
						updatedAt: enrollment.updatedAt,
						courseIdJoined: course.id,
						courseTitle: course.title,
						courseSlug: course.slug,
					})
					.from(enrollment)
					.innerJoin(course, eq(enrollment.courseId, course.id))
					.where(inArray(enrollment.orderItemId, itemIds))
					.orderBy(enrollment.enrolledAt);

	return {
		order: {
			id: order.id,
			status: order.status,
			subtotalCents: order.subtotalCents,
			totalCents: order.totalCents,
			currency: order.currency,
			createdAt: order.createdAt,
			updatedAt: order.updatedAt,
			paidAt: order.paidAt,
			refundedAt: order.refundedAt,
		},
		buyer: {
			id: order.buyerId,
			name: order.buyerName,
			email: order.buyerEmail,
			image: order.buyerImage,
			role: order.buyerRole,
		},
		items: items.map((item) => ({
			id: item.id,
			courseId: item.courseId,
			titleSnapshot: item.titleSnapshot,
			priceCents: item.priceCents,
			currency: item.currency,
			createdAt: item.createdAt,
			course: {
				id: item.courseIdJoined,
				title: item.courseTitle,
				slug: item.courseSlug,
				status: item.courseStatus,
			},
		})),
		payments,
		enrollments: enrollments.map((row) => ({
			id: row.id,
			userId: row.userId,
			courseId: row.courseId,
			orderItemId: row.orderItemId,
			status: row.status,
			enrolledAt: row.enrolledAt,
			completedAt: row.completedAt,
			updatedAt: row.updatedAt,
			course: {
				id: row.courseIdJoined,
				title: row.courseTitle,
				slug: row.courseSlug,
			},
		})),
	};
};
