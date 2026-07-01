import { sValidator } from "@hono/standard-validator";
import { createFactory } from "hono/factory";
import { jsonOk } from "../../../shared/utils/json-response.js";
import {
	getCourseCurriculumService,
	getCourseDetailsService,
	getCoursePerformanceService,
	listCoursesService,
	updateCourseService,
	updateCourseStatusService,
} from "./courses.service.js";
import { validationError } from "./courses.utils.js";
import {
	courseIdParamsSchema,
	coursePerformanceQuerySchema,
	listCoursesQuerySchema,
	updateCourseBodySchema,
	updateCourseStatusBodySchema,
} from "./courses.validation.js";

const factory = createFactory();

// Business: admin can manage the full course catalog.
export const listCourses = factory.createHandlers(
	sValidator("query", listCoursesQuerySchema, (result, c) => {
		if (!result.success) return validationError(result, c);
	}),
	async (c) => {
		const data = await listCoursesService(c.req.valid("query"));

		return jsonOk({
			c,
			message: "Courses",
			data,
		});
	},
);

// Business: admin can inspect one course deeply.
export const getCourseDetails = factory.createHandlers(
	sValidator("param", courseIdParamsSchema, (result, c) => {
		if (!result.success) return validationError(result, c);
	}),
	async (c) => {
		const { courseId } = c.req.valid("param");
		const data = await getCourseDetailsService(courseId);

		return jsonOk({
			c,
			message: "Course details",
			data,
		});
	},
);

// Business: admin can update important course fields.
export const updateCourse = factory.createHandlers(
	sValidator("param", courseIdParamsSchema, (result, c) => {
		if (!result.success) return validationError(result, c);
	}),
	sValidator("json", updateCourseBodySchema, (result, c) => {
		if (!result.success) return validationError(result, c);
	}),
	async (c) => {
		const { courseId } = c.req.valid("param");
		const data = await updateCourseService(courseId, c.req.valid("json"));

		return jsonOk({
			c,
			message: "Course updated",
			data,
		});
	},
);

// Business: admin can publish, draft, or archive a course.
export const updateCourseStatus = factory.createHandlers(
	sValidator("param", courseIdParamsSchema, (result, c) => {
		if (!result.success) return validationError(result, c);
	}),
	sValidator("json", updateCourseStatusBodySchema, (result, c) => {
		if (!result.success) return validationError(result, c);
	}),
	async (c) => {
		const { courseId } = c.req.valid("param");
		const data = await updateCourseStatusService(courseId, c.req.valid("json"));

		return jsonOk({
			c,
			message: "Course status updated",
			data,
		});
	},
);

// Business: admin can review the course content structure.
export const getCourseCurriculum = factory.createHandlers(
	sValidator("param", courseIdParamsSchema, (result, c) => {
		if (!result.success) return validationError(result, c);
	}),
	async (c) => {
		const { courseId } = c.req.valid("param");
		const data = await getCourseCurriculumService(courseId);

		return jsonOk({
			c,
			message: "Course curriculum",
			data,
		});
	},
);

// Business: admin can see course sales and learning results.
export const getCoursePerformance = factory.createHandlers(
	sValidator("param", courseIdParamsSchema, (result, c) => {
		if (!result.success) return validationError(result, c);
	}),
	sValidator("query", coursePerformanceQuerySchema, (result, c) => {
		if (!result.success) return validationError(result, c);
	}),
	async (c) => {
		const { courseId } = c.req.valid("param");
		const data = await getCoursePerformanceService(
			courseId,
			c.req.valid("query"),
		);

		return jsonOk({
			c,
			message: "Course performance",
			data,
		});
	},
);
