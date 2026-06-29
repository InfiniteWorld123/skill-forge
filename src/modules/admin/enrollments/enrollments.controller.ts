import { createFactory } from "hono/factory";
import { jsonOk } from "../../../shared/utils/json-response.js";
import {
	getEnrollmentDetailsSkeleton,
	listEnrollmentsSkeleton,
	updateEnrollmentStatusSkeleton,
} from "./enrollments.service.js";

const factory = createFactory();

// Business: admin can see who has course access.
export const listEnrollments = factory.createHandlers(async (c) => {
	return jsonOk({
		c,
		message: "List enrollments skeleton",
		data: listEnrollmentsSkeleton(),
	});
});

// Business: admin can inspect one student's course access and progress.
export const getEnrollmentDetails = factory.createHandlers(async (c) => {
	return jsonOk({
		c,
		message: "Enrollment details skeleton",
		data: getEnrollmentDetailsSkeleton(),
	});
});

// Business: admin can change course access status.
export const updateEnrollmentStatus = factory.createHandlers(async (c) => {
	return jsonOk({
		c,
		message: "Update enrollment status skeleton",
		data: updateEnrollmentStatusSkeleton(),
	});
});
