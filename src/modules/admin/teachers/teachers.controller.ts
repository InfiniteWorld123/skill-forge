import { sValidator } from "@hono/standard-validator";
import { createFactory } from "hono/factory";
import { jsonOk } from "../../../shared/utils/json-response.js";
import {
	getTeacherDetailsService,
	listTeachersService,
	updateTeacherVisibilityService,
} from "./teachers.service.js";
import {
	listTeachersQuerySchema,
	teacherProfileParamsSchema,
	updateTeacherVisibilityBodySchema,
} from "./teachers.validation.js";
import { validationError } from "./teachers.utils.js";

const factory = createFactory();

// Business: admin can see which teachers create value.
export const listTeachers = factory.createHandlers(
	sValidator("query", listTeachersQuerySchema, (result, c) => {
		if (!result.success) return validationError(result, c);
	}),
	async (c) => {
		const data = await listTeachersService(c.req.valid("query"));

		return jsonOk({
			c,
			message: "Teachers",
			data,
		});
	},
);

// Business: admin can inspect one teacher and their courses.
export const getTeacherDetails = factory.createHandlers(
	sValidator("param", teacherProfileParamsSchema, (result, c) => {
		if (!result.success) return validationError(result, c);
	}),
	async (c) => {
		const { teacherProfileId } = c.req.valid("param");
		const data = await getTeacherDetailsService(teacherProfileId);

		return jsonOk({
			c,
			message: "Teacher details",
			data,
		});
	},
);

// Business: admin can hide or show a teacher profile.
export const updateTeacherVisibility = factory.createHandlers(
	sValidator("param", teacherProfileParamsSchema, (result, c) => {
		if (!result.success) return validationError(result, c);
	}),
	sValidator("json", updateTeacherVisibilityBodySchema, (result, c) => {
		if (!result.success) return validationError(result, c);
	}),
	async (c) => {
		const { teacherProfileId } = c.req.valid("param");
		const data = await updateTeacherVisibilityService(
			teacherProfileId,
			c.req.valid("json"),
		);

		return jsonOk({
			c,
			message: "Teacher visibility updated",
			data,
		});
	},
);
