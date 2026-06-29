import { createFactory } from "hono/factory";
import { jsonOk } from "../../../shared/utils/json-response.js";
import {
	getOrderDetailsSkeleton,
	getRevenueSummarySkeleton,
	listOrdersSkeleton,
	listPaymentsSkeleton,
} from "./orders.service.js";

const factory = createFactory();

// Business: admin can see platform purchases.
export const listOrders = factory.createHandlers(async (c) => {
	return jsonOk({
		c,
		message: "List orders skeleton",
		data: listOrdersSkeleton(),
	});
});

// Business: admin can see high-level money numbers.
export const getRevenueSummary = factory.createHandlers(async (c) => {
	return jsonOk({
		c,
		message: "Revenue summary skeleton",
		data: getRevenueSummarySkeleton(),
	});
});

// Business: admin can inspect payment provider records.
export const listPayments = factory.createHandlers(async (c) => {
	return jsonOk({
		c,
		message: "List payments skeleton",
		data: listPaymentsSkeleton(),
	});
});

// Business: admin can investigate one order.
export const getOrderDetails = factory.createHandlers(async (c) => {
	return jsonOk({
		c,
		message: "Order details skeleton",
		data: getOrderDetailsSkeleton(),
	});
});
