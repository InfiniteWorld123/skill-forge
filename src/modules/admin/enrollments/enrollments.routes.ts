import { Hono } from "hono";
import {
	getEnrollmentDetails,
	listEnrollments,
	updateEnrollmentStatus,
} from "./enrollments.controller.js";

const enrollmentsRoute = new Hono()
	// Business: admin sees all course enrollments.
	.get("/", ...listEnrollments)
	// Business: admin sees one enrollment and progress.
	.get("/:enrollmentId", ...getEnrollmentDetails)
	// Business: admin changes access status.
	.patch("/:enrollmentId/status", ...updateEnrollmentStatus);

export default enrollmentsRoute;
