import { Hono } from "hono";
import {
	getDashboardCharts,
	getDashboardOverview,
	getRecentActivity,
} from "./dashboard.controller.js";

const dashboardRoute = new Hono()
	// Business: admin sees the main health numbers of the platform.
	.get("/overview", ...getDashboardOverview)
	// Business: admin sees the latest important events.
	.get("/recent-activity", ...getRecentActivity)
	// Business: admin gets data for growth and sales charts.
	.get("/charts", ...getDashboardCharts);

export default dashboardRoute;
