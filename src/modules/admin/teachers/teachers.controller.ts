import { createFactory } from "hono/factory";
import { jsonOk } from "../../../shared/utils/json-response.js";
import {
	getTeacherDetailsSkeleton,
	listTeachersSkeleton,
	updateTeacherVisibilitySkeleton,
} from "./teachers.service.js";

const factory = createFactory();

// Business: admin can see which teachers create value.
export const listTeachers = factory.createHandlers(async (c) => {
	return jsonOk({
		c,
		message: "List teachers skeleton",
		data: listTeachersSkeleton(),
	});
});

// Business: admin can inspect one teacher and their courses.
export const getTeacherDetails = factory.createHandlers(async (c) => {
	return jsonOk({
		c,
		message: "Teacher details skeleton",
		data: getTeacherDetailsSkeleton(),
	});
});

// Business: admin can hide or show a teacher profile.
export const updateTeacherVisibility = factory.createHandlers(async (c) => {
	return jsonOk({
		c,
		message: "Update teacher visibility skeleton",
		data: updateTeacherVisibilitySkeleton(),
	});
});
