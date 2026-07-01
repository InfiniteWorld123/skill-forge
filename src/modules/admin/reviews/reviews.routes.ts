import { Hono } from "hono";
import {
	getReviewDetails,
	getReviewsSummary,
	listReviews,
} from "./reviews.controller.js";

const reviewsRoute = new Hono()
	// Business: admin sees all reviews.
	.get("/", ...listReviews)
	// Business: admin sees rating and quality summary.
	.get("/summary", ...getReviewsSummary)
	// Business: admin sees one review.
	.get("/:reviewId", ...getReviewDetails);

export default reviewsRoute;

