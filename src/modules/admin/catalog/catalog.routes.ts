import { Hono } from "hono";
import {
	createCategory,
	createTag,
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
	// Business: admin sees all course tags.
	.get("/tags", ...listTags)
	// Business: admin creates a course tag.
	.post("/tags", ...createTag)
	// Business: admin updates a course tag.
	.patch("/tags/:tagId", ...updateTag);

export default catalogRoute;
