import { sValidator } from "@hono/standard-validator";
import { createFactory } from "hono/factory";
import { jsonOk } from "../../../shared/utils/json-response.js";
import {
	getOrderDetailsService,
	getRevenueSummaryService,
	listOrdersService,
	listPaymentsService,
} from "./orders.service.js";
import { validationError } from "./orders.utils.js";
import {
	getOrderDetailsParamsSchema,
	getRevenueSummaryQuerySchema,
	listOrdersQuerySchema,
	listPaymentsQuerySchema,
} from "./orders.validation.js";

const factory = createFactory();

// Business: admin can see platform purchases.
export const listOrders = factory.createHandlers(
	sValidator("query", listOrdersQuerySchema, (result, c) => {
		if (!result.success) return validationError(result, c);
	}),
	async (c) => {
		const data = await listOrdersService(c.req.valid("query"));

		return jsonOk({
			c,
			message: "Orders",
			data,
		});
	},
);

// Business: admin can see high-level money numbers.
export const getRevenueSummary = factory.createHandlers(
	sValidator("query", getRevenueSummaryQuerySchema, (result, c) => {
		if (!result.success) return validationError(result, c);
	}),
	async (c) => {
		const data = await getRevenueSummaryService(c.req.valid("query"));

		return jsonOk({
			c,
			message: "Revenue summary",
			data,
		});
	},
);

// Business: admin can inspect payment provider records.
export const listPayments = factory.createHandlers(
	sValidator("query", listPaymentsQuerySchema, (result, c) => {
		if (!result.success) return validationError(result, c);
	}),
	async (c) => {
		const data = await listPaymentsService(c.req.valid("query"));

		return jsonOk({
			c,
			message: "Payments",
			data,
		});
	},
);

// Business: admin can investigate one order.
export const getOrderDetails = factory.createHandlers(
	sValidator("param", getOrderDetailsParamsSchema, (result, c) => {
		if (!result.success) return validationError(result, c);
	}),
	async (c) => {
		const { orderId } = c.req.valid("param");
		const data = await getOrderDetailsService(orderId);

		return jsonOk({
			c,
			message: "Order details",
			data,
		});
	},
);
