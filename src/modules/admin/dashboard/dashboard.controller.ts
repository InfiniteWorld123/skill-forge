import { createFactory } from "hono/factory";
import { jsonOk } from "../../../shared/utils/json-response.js";
import {
	getDashboardChartsSkeleton,
	getDashboardOverviewSkeleton,
	getRecentActivitySkeleton,
} from "./dashboard.service.js";

const factory = createFactory();

// Business: show the most important platform numbers.
export const getDashboardOverview = factory.createHandlers(async (c) => {
	return jsonOk({
		c,
		message: "Dashboard overview skeleton",
		data: getDashboardOverviewSkeleton(),
	});
});

// Business: show the newest important actions on the platform.
export const getRecentActivity = factory.createHandlers(async (c) => {
	return jsonOk({
		c,
		message: "Recent activity skeleton",
		data: getRecentActivitySkeleton(),
	});
});

// Business: show chart data for a SaaS-style dashboard.
export const getDashboardCharts = factory.createHandlers(async (c) => {
	return jsonOk({
		c,
		message: "Dashboard charts skeleton",
		data: getDashboardChartsSkeleton(),
	});
});
