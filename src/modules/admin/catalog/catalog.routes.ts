import { Hono } from "hono";
import {
	createCategory,
	createTag,
	deleteCategories,
	deleteCategory,
	deleteTag,
	deleteTags,
	listCategories,
	listTags,
	updateCategory,
	updateTag,
} from "./catalog.controller.js";

const catalogRoute = new Hono()
	// Business: admin sees all course categories.
	.get("/categories", ...listCategories)
	// Business: admin creates a course category.
	.post("/categories", ...createCategory)
	// Business: admin updates a course category.
	.patch("/categories/:categoryId", ...updateCategory)
	// Business: admin removes many course categories.
	.delete("/categories", ...deleteCategories)
	// Business: admin removes one course category.
	.delete("/categories/:categoryId", ...deleteCategory)
	// Business: admin sees all course tags.
	.get("/tags", ...listTags)
	// Business: admin creates a course tag.
	.post("/tags", ...createTag)
	// Business: admin updates a course tag.
	.patch("/tags/:tagId", ...updateTag)
	// Business: admin removes many course tags.
	.delete("/tags", ...deleteTags)
	// Business: admin removes one course tag.
	.delete("/tags/:tagId", ...deleteTag);

export default catalogRoute;
