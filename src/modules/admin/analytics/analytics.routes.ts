import { Hono } from "hono";
import {
	getCompletionAnalytics,
	getCourseAnalytics,
	getSalesAnalytics,
	getUserAnalytics,
} from "./analytics.controller.js";

const analyticsRoute = new Hono()
	// Business: admin sees user growth.
	.get("/users", ...getUserAnalytics)
	// Business: admin sees course health and popularity.
	.get("/courses", ...getCourseAnalytics)
	// Business: admin sees revenue and payment trends.
	.get("/sales", ...getSalesAnalytics)
	// Business: admin sees course completion results.
	.get("/completion", ...getCompletionAnalytics);

export default analyticsRoute;
