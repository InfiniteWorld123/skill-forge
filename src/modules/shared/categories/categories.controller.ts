import { sValidator } from "@hono/standard-validator";
import type { Context } from "hono";
import { createFactory } from "hono/factory";
import { jsonOk } from "../../../shared/utils/json-response.js";
import {
	listSharedCategoriesService,
	listSharedTagsService,
} from "./categories.service.js";
import {
	listCategoriesQuerySchema,
	listTagsQuerySchema,
} from "./categories.validation.js";

const factory = createFactory();

const validationError = (
	result: { success: false; error: unknown },
	c: Context,
) => {
	return c.json({ success: false, errors: result.error }, 400);
};

// Business: students and teachers can discover active course categories.
export const listCategories = factory.createHandlers(
	sValidator("query", listCategoriesQuerySchema, (result, c) => {
		if (!result.success) return validationError(result, c);
	}),
	async (c) => {
		const data = await listSharedCategoriesService(c.req.valid("query"));

		return jsonOk({
			c,
			message: "Course categories",
			data,
		});
	},
);

// Business: students and teachers can filter course discovery by tags.
export const listTags = factory.createHandlers(
	sValidator("query", listTagsQuerySchema, (result, c) => {
		if (!result.success) return validationError(result, c);
	}),
	async (c) => {
		const data = await listSharedTagsService(c.req.valid("query"));

		return jsonOk({
			c,
			message: "Course tags",
			data,
		});
	},
);
