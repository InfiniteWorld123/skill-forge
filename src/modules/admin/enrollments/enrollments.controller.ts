import { sValidator } from "@hono/standard-validator";
import { createFactory } from "hono/factory";
import { jsonOk } from "../../../shared/utils/json-response.js";
import {
	getEnrollmentDetailsService,
	listEnrollmentsService,
	updateEnrollmentStatusService,
} from "./enrollments.service.js";
import { validationError } from "./enrollments.utils.js";
import {
	enrollmentIdParamsSchema,
	listEnrollmentsQuerySchema,
	updateEnrollmentStatusBodySchema,
} from "./enrollments.validation.js";

const factory = createFactory();

// Business: admin can see who has course access.
export const listEnrollments = factory.createHandlers(
	sValidator("query", listEnrollmentsQuerySchema, (result, c) => {
		if (!result.success) return validationError(result, c);
	}),
	async (c) => {
		const data = await listEnrollmentsService(c.req.valid("query"));

		return jsonOk({
			c,
			message: "Enrollments",
			data,
		});
	},
);

// Business: admin can inspect one student's course access and progress.
export const getEnrollmentDetails = factory.createHandlers(
	sValidator("param", enrollmentIdParamsSchema, (result, c) => {
		if (!result.success) return validationError(result, c);
	}),
	async (c) => {
		const { enrollmentId } = c.req.valid("param");
		const data = await getEnrollmentDetailsService(enrollmentId);

		return jsonOk({
			c,
			message: "Enrollment details",
			data,
		});
	},
);

// Business: admin can change course access status.
export const updateEnrollmentStatus = factory.createHandlers(
	sValidator("param", enrollmentIdParamsSchema, (result, c) => {
		if (!result.success) return validationError(result, c);
	}),
	sValidator("json", updateEnrollmentStatusBodySchema, (result, c) => {
		if (!result.success) return validationError(result, c);
	}),
	async (c) => {
		const { enrollmentId } = c.req.valid("param");
		const data = await updateEnrollmentStatusService(
			enrollmentId,
			c.req.valid("json"),
		);

		return jsonOk({
			c,
			message: "Enrollment status updated",
			data,
		});
	},
);
