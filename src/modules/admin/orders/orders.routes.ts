import { Hono } from "hono";
import {
	getOrderDetails,
	getRevenueSummary,
	listOrders,
	listPayments,
} from "./orders.controller.js";

const ordersRoute = new Hono()
	// Business: admin sees all orders.
	.get("/", ...listOrders)
	// Business: admin sees revenue numbers.
	.get("/revenue-summary", ...getRevenueSummary)
	// Business: admin sees all payment records.
	.get("/payments", ...listPayments)
	// Business: admin sees one order with details.
	.get("/:orderId", ...getOrderDetails);

export default ordersRoute;
