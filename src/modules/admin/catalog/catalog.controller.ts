import { sValidator } from "@hono/standard-validator";
import type { Context } from "hono";
import { createFactory } from "hono/factory";
import { jsonOk } from "../../../shared/utils/json-response.js";
import {
	createCategoryService,
	createTagService,
	deleteCategoriesService,
	deleteCategoryService,
	deleteTagService,
	deleteTagsService,
	listCategoriesService,
	listTagsService,
	updateCategoryService,
	updateTagService,
} from "./catalog.service.js";
import {
	createCategoryBodySchema,
	createTagBodySchema,
	deleteCategoriesBodySchema,
	deleteCategoryParamsSchema,
	deleteTagParamsSchema,
	deleteTagsBodySchema,
	listCategoriesQuerySchema,
	listTagsQuerySchema,
	updateCategoryBodySchema,
	updateCategoryParamsSchema,
	updateTagBodySchema,
	updateTagParamsSchema,
} from "./catalog.validation.js";

const factory = createFactory();

const validationError = (
	result: { success: false; error: unknown },
	c: Context,
) => {
	return c.json({ success: false, errors: result.error }, 400);
};

// Business: admin can organize courses into categories.
export const listCategories = factory.createHandlers(
	sValidator("query", listCategoriesQuerySchema, (result, c) => {
		if (!result.success) return validationError(result, c);
	}),
	async (c) => {
		const data = await listCategoriesService(c.req.valid("query"));

		return jsonOk({
			c,
			message: "Course categories",
			data,
		});
	},
);

// Business: admin can create a new course category.
export const createCategory = factory.createHandlers(
	sValidator("json", createCategoryBodySchema, (result, c) => {
		if (!result.success) return validationError(result, c);
	}),
	async (c) => {
		const data = await createCategoryService(c.req.valid("json"));

		return jsonOk({
			c,
			message: "Course category created",
			data,
			status: 201,
		});
	},
);

// Business: admin can update an existing course category.
export const updateCategory = factory.createHandlers(
	sValidator("param", updateCategoryParamsSchema, (result, c) => {
		if (!result.success) return validationError(result, c);
	}),
	sValidator("json", updateCategoryBodySchema, (result, c) => {
		if (!result.success) return validationError(result, c);
	}),
	async (c) => {
		const { categoryId } = c.req.valid("param");
		const data = await updateCategoryService(categoryId, c.req.valid("json"));

		return jsonOk({
			c,
			message: "Course category updated",
			data,
		});
	},
);

// Business: admin can remove one course category.
export const deleteCategory = factory.createHandlers(
	sValidator("param", deleteCategoryParamsSchema, (result, c) => {
		if (!result.success) return validationError(result, c);
	}),
	async (c) => {
		const { categoryId } = c.req.valid("param");
		const data = await deleteCategoryService(categoryId);

		return jsonOk({
			c,
			message: "Course category deleted",
			data,
		});
	},
);

// Business: admin can remove many course categories.
export const deleteCategories = factory.createHandlers(
	sValidator("json", deleteCategoriesBodySchema, (result, c) => {
		if (!result.success) return validationError(result, c);
	}),
	async (c) => {
		const data = await deleteCategoriesService(c.req.valid("json"));

		return jsonOk({
			c,
			message: "Course categories deleted",
			data,
		});
	},
);

// Business: admin can organize courses with tags.
export const listTags = factory.createHandlers(
	sValidator("query", listTagsQuerySchema, (result, c) => {
		if (!result.success) return validationError(result, c);
	}),
	async (c) => {
		const data = await listTagsService(c.req.valid("query"));

		return jsonOk({ c, message: "Course tags", data });
	},
);

// Business: admin can create a new course tag.
export const createTag = factory.createHandlers(
	sValidator("json", createTagBodySchema, (result, c) => {
		if (!result.success) return validationError(result, c);
	}),
	async (c) => {
		const data = await createTagService(c.req.valid("json"));

		return jsonOk({
			c,
			message: "Course tag created",
			data,
			status: 201,
		});
	},
);

// Business: admin can update an existing course tag.
export const updateTag = factory.createHandlers(
	sValidator("param", updateTagParamsSchema, (result, c) => {
		if (!result.success) return validationError(result, c);
	}),
	sValidator("json", updateTagBodySchema, (result, c) => {
		if (!result.success) return validationError(result, c);
	}),
	async (c) => {
		const { tagId } = c.req.valid("param");
		const data = await updateTagService(tagId, c.req.valid("json"));

		return jsonOk({ c, message: "Course tag updated", data });
	},
);

// Business: admin can remove one course tag.
export const deleteTag = factory.createHandlers(
	sValidator("param", deleteTagParamsSchema, (result, c) => {
		if (!result.success) return validationError(result, c);
	}),
	async (c) => {
		const { tagId } = c.req.valid("param");
		const data = await deleteTagService(tagId);

		return jsonOk({ c, message: "Course tag deleted", data });
	},
);

// Business: admin can remove many course tags.
export const deleteTags = factory.createHandlers(
	sValidator("json", deleteTagsBodySchema, (result, c) => {
		if (!result.success) return validationError(result, c);
	}),
	async (c) => {
		const data = await deleteTagsService(c.req.valid("json"));

		return jsonOk({ c, message: "Course tags deleted", data });
	},
);
