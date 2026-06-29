import { createAdminEndpointSkeleton } from "../admin.service.js";

export const listOrdersSkeleton = () => {
	return createAdminEndpointSkeleton({
		area: "Orders",
		api: "List orders",
		method: "GET",
		path: "/admin/orders",
		businessMeaning:
			"Admin sees purchases and can filter by status, user, date, currency, and amount.",
		dataSource: ["purchase_order", "user", "purchase_order_item", "payment"],
		futureLogic: [
			"Return orders with buyer, total, status, and latest payment.",
			"Support filters for finance and support work.",
		],
	});
};

export const getRevenueSummarySkeleton = () => {
	return createAdminEndpointSkeleton({
		area: "Orders",
		api: "Revenue summary",
		method: "GET",
		path: "/admin/orders/revenue-summary",
		businessMeaning:
			"Admin sees money numbers like paid revenue, refunded revenue, and average order value.",
		dataSource: ["purchase_order", "payment"],
		futureLogic: [
			"Sum paid orders and refunded orders.",
			"Calculate average order value and failed payment count.",
		],
	});
};

export const listPaymentsSkeleton = () => {
	return createAdminEndpointSkeleton({
		area: "Orders",
		api: "List payments",
		method: "GET",
		path: "/admin/orders/payments",
		businessMeaning:
			"Admin sees payment provider records and can find failed or pending payments.",
		dataSource: ["payment", "purchase_order", "user"],
		futureLogic: [
			"Return payments with provider, status, amount, and order.",
			"Support provider and payment status filters.",
		],
	});
};

export const getOrderDetailsSkeleton = () => {
	return createAdminEndpointSkeleton({
		area: "Orders",
		api: "Order details",
		method: "GET",
		path: "/admin/orders/:orderId",
		businessMeaning:
			"Admin sees one order with buyer, courses, payment records, and enrollments.",
		dataSource: [
			"purchase_order",
			"purchase_order_item",
			"payment",
			"user",
			"enrollment",
		],
		futureLogic: [
			"Load order, items, payments, and enrollments created from the order.",
			"Help investigate payment or access problems.",
		],
	});
};
