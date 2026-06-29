import { createFactory } from "hono/factory";
import { jsonOk } from "../../../shared/utils/json-response.js";
import {
	createCategorySkeleton,
	createTagSkeleton,
	listCategoriesSkeleton,
	listTagsSkeleton,
	updateCategorySkeleton,
	updateTagSkeleton,
} from "./catalog.service.js";

const factory = createFactory();

// Business: admin can organize courses into categories.
export const listCategories = factory.createHandlers(async (c) => {
	return jsonOk({
		c,
		message: "List categories skeleton",
		data: listCategoriesSkeleton(),
	});
});

// Business: admin can create a new course category.
export const createCategory = factory.createHandlers(async (c) => {
	return jsonOk({
		c,
		message: "Create category skeleton",
		data: createCategorySkeleton(),
	});
});

// Business: admin can update an existing course category.
export const updateCategory = factory.createHandlers(async (c) => {
	return jsonOk({
		c,
		message: "Update category skeleton",
		data: updateCategorySkeleton(),
	});
});

// Business: admin can organize courses with tags.
export const listTags = factory.createHandlers(async (c) => {
	return jsonOk({ c, message: "List tags skeleton", data: listTagsSkeleton() });
});

// Business: admin can create a new course tag.
export const createTag = factory.createHandlers(async (c) => {
	return jsonOk({ c, message: "Create tag skeleton", data: createTagSkeleton() });
});

// Business: admin can update an existing course tag.
export const updateTag = factory.createHandlers(async (c) => {
	return jsonOk({ c, message: "Update tag skeleton", data: updateTagSkeleton() });
});
