import { createAdminEndpointSkeleton } from "../admin.service.js";

export const listCategoriesSkeleton = () => {
	return createAdminEndpointSkeleton({
		area: "Catalog",
		api: "List categories",
		method: "GET",
		path: "/admin/catalog/categories",
		businessMeaning:
			"Admin sees course categories and how many courses use each one.",
		dataSource: ["course_category", "course"],
		futureLogic: [
			"Return categories with course count.",
			"Support active and inactive category filters.",
		],
	});
};

export const createCategorySkeleton = () => {
	return createAdminEndpointSkeleton({
		area: "Catalog",
		api: "Create category",
		method: "POST",
		path: "/admin/catalog/categories",
		businessMeaning:
			"Admin creates a new main group for courses.",
		dataSource: ["course_category"],
		futureLogic: [
			"Validate name, slug, and description.",
			"Insert a new category.",
		],
	});
};

export const updateCategorySkeleton = () => {
	return createAdminEndpointSkeleton({
		area: "Catalog",
		api: "Update category",
		method: "PATCH",
		path: "/admin/catalog/categories/:categoryId",
		businessMeaning:
			"Admin updates a category name, slug, description, or active flag.",
		dataSource: ["course_category"],
		futureLogic: [
			"Validate categoryId and editable fields.",
			"Update the category record.",
		],
	});
};

export const listTagsSkeleton = () => {
	return createAdminEndpointSkeleton({
		area: "Catalog",
		api: "List tags",
		method: "GET",
		path: "/admin/catalog/tags",
		businessMeaning:
			"Admin sees tags and how often they are used by courses.",
		dataSource: ["tag", "course_tag"],
		futureLogic: [
			"Return tags with usage count.",
			"Support search by tag name.",
		],
	});
};

export const createTagSkeleton = () => {
	return createAdminEndpointSkeleton({
		area: "Catalog",
		api: "Create tag",
		method: "POST",
		path: "/admin/catalog/tags",
		businessMeaning:
			"Admin creates a small label that helps course search and filtering.",
		dataSource: ["tag"],
		futureLogic: [
			"Validate name and slug.",
			"Insert a new tag.",
		],
	});
};

export const updateTagSkeleton = () => {
	return createAdminEndpointSkeleton({
		area: "Catalog",
		api: "Update tag",
		method: "PATCH",
		path: "/admin/catalog/tags/:tagId",
		businessMeaning:
			"Admin updates a tag name or slug.",
		dataSource: ["tag"],
		futureLogic: [
			"Validate tagId and editable fields.",
			"Update the tag record.",
		],
	});
};
