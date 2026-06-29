import { createFactory } from "hono/factory";
import { jsonOk } from "../../../shared/utils/json-response.js";
import {
	getCourseCurriculumSkeleton,
	getCourseDetailsSkeleton,
	getCoursePerformanceSkeleton,
	listCoursesSkeleton,
	updateCourseSkeleton,
	updateCourseStatusSkeleton,
} from "./courses.service.js";

const factory = createFactory();

// Business: admin can manage the full course catalog.
export const listCourses = factory.createHandlers(async (c) => {
	return jsonOk({
		c,
		message: "List courses skeleton",
		data: listCoursesSkeleton(),
	});
});

// Business: admin can inspect one course deeply.
export const getCourseDetails = factory.createHandlers(async (c) => {
	return jsonOk({
		c,
		message: "Course details skeleton",
		data: getCourseDetailsSkeleton(),
	});
});

// Business: admin can update important course fields.
export const updateCourse = factory.createHandlers(async (c) => {
	return jsonOk({
		c,
		message: "Update course skeleton",
		data: updateCourseSkeleton(),
	});
});

// Business: admin can publish, draft, or archive a course.
export const updateCourseStatus = factory.createHandlers(async (c) => {
	return jsonOk({
		c,
		message: "Update course status skeleton",
		data: updateCourseStatusSkeleton(),
	});
});

// Business: admin can review the course content structure.
export const getCourseCurriculum = factory.createHandlers(async (c) => {
	return jsonOk({
		c,
		message: "Course curriculum skeleton",
		data: getCourseCurriculumSkeleton(),
	});
});

// Business: admin can see course sales and learning results.
export const getCoursePerformance = factory.createHandlers(async (c) => {
	return jsonOk({
		c,
		message: "Course performance skeleton",
		data: getCoursePerformanceSkeleton(),
	});
});
