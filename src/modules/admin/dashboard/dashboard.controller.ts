import { sValidator } from "@hono/standard-validator";
import { createFactory } from "hono/factory";
import { jsonOk } from "../../../shared/utils/json-response.js";
import {
	getDashboardChartsService,
	getDashboardOverviewService,
	getRecentActivityService,
} from "./dashboard.service.js";
import { validationError } from "./dashboard.utils.js";
import {
	getDashboardChartsQuerySchema,
	getRecentActivityQuerySchema,
} from "./dashboard.validation.js";

const factory = createFactory();

// Business: show the most important platform numbers.
export const getDashboardOverview = factory.createHandlers(async (c) => {
	const data = await getDashboardOverviewService();

	return jsonOk({
		c,
		message: "Dashboard overview",
		data,
	});
});

// Business: show the newest important actions on the platform.
export const getRecentActivity = factory.createHandlers(
	sValidator("query", getRecentActivityQuerySchema, (result, c) => {
		if (!result.success) return validationError(result, c);
	}),
	async (c) => {
		const data = await getRecentActivityService(c.req.valid("query"));

		return jsonOk({
			c,
			message: "Recent activity",
			data,
		});
	},
);

// Business: show chart data for a SaaS-style dashboard.
export const getDashboardCharts = factory.createHandlers(
	sValidator("query", getDashboardChartsQuerySchema, (result, c) => {
		if (!result.success) return validationError(result, c);
	}),
	async (c) => {
		const data = await getDashboardChartsService(c.req.valid("query"));

		return jsonOk({
			c,
			message: "Dashboard charts",
			data,
		});
	},
);
