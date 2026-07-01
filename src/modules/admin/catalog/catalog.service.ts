import {
	and,
	asc,
	count,
	desc,
	eq,
	ilike,
	inArray,
	or,
	type SQL,
	type SQLWrapper,
} from "drizzle-orm";
import { db } from "../../../db/db.js";
import {
	course,
	courseCategory,
	courseTag,
	tag,
} from "../../../db/schemas/schema.js";
import { conflictError, notFoundError } from "../../../shared/constants/errors.js";
import type {
	CreateCategoryInput,
	CreateTagInput,
	DeleteCategoriesInput,
	DeleteTagsInput,
	ListCategoriesQuery,
	ListTagsQuery,
	UpdateCategoryInput,
	UpdateTagInput,
} from "./catalog.validation.js";

type PaginationInput = {
	limit?: string;
	offset?: string;
};

type Paginations = {
	total: number;
	limit: number;
	offset: number;
	hasNextPage: boolean;
	hasPreviousPage: boolean;
};

const getPagination = (query: PaginationInput) => {
	return {
		limit: query.limit ? Number(query.limit) : 20,
		offset: query.offset ? Number(query.offset) : 0,
	};
};

const getPaginations = ({
	total,
	limit,
	offset,
	itemCount,
}: {
	total: number;
	limit: number;
	offset: number;
	itemCount: number;
}): Paginations => {
	return {
		total,
		limit,
		offset,
		hasNextPage: offset + itemCount < total,
		hasPreviousPage: offset > 0,
	};
};

const toSlug = (value: string) => {
	const slug = value
		.normalize("NFKD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");

	return slug || "item";
};

const isUniqueConstraintError = (error: unknown) => {
	if (!error || typeof error !== "object") return false;

	const dbError = error as { code?: unknown; cause?: { code?: unknown } };

	return dbError.code === "23505" || dbError.cause?.code === "23505";
};

const getCategoryFilters = (query: ListCategoriesQuery) => {
	const filters: SQLWrapper[] = [];

	if (query.search) {
		const search = `%${query.search}%`;
		const searchFilter = or(
			ilike(courseCategory.name, search),
			ilike(courseCategory.slug, search),
		);

		if (searchFilter) filters.push(searchFilter);
	}

	if (query.isActive) {
		filters.push(eq(courseCategory.isActive, query.isActive === "true"));
	}

	return filters.length > 0 ? and(...filters) : undefined;
};

const getTagFilters = (query: ListTagsQuery) => {
	const filters: SQLWrapper[] = [];

	if (query.search) {
		const search = `%${query.search}%`;
		const searchFilter = or(ilike(tag.name, search), ilike(tag.slug, search));

		if (searchFilter) filters.push(searchFilter);
	}

	return filters.length > 0 ? and(...filters) : undefined;
};

const getCategorySort = (
	sortBy: ListCategoriesQuery["sortBy"] = "createdAt",
	sortDirection: ListCategoriesQuery["sortDirection"] = "desc",
	courseCount: SQL<number>,
) => {
	const columns = {
		name: courseCategory.name,
		slug: courseCategory.slug,
		isActive: courseCategory.isActive,
		courseCount,
		createdAt: courseCategory.createdAt,
		updatedAt: courseCategory.updatedAt,
	};

	const column = columns[sortBy];

	return sortDirection === "asc" ? asc(column) : desc(column);
};

const getTagSort = (
	sortBy: ListTagsQuery["sortBy"] = "createdAt",
	sortDirection: ListTagsQuery["sortDirection"] = "desc",
	courseCount: SQL<number>,
) => {
	const columns = {
		name: tag.name,
		slug: tag.slug,
		courseCount,
		createdAt: tag.createdAt,
		updatedAt: tag.updatedAt,
	};

	const column = columns[sortBy];

	return sortDirection === "asc" ? asc(column) : desc(column);
};

const selectCategoryById = async (categoryId: string) => {
	const categoryCourseCount = count(course.id);

	const [category] = await db
		.select({
			id: courseCategory.id,
			name: courseCategory.name,
			slug: courseCategory.slug,
			description: courseCategory.description,
			isActive: courseCategory.isActive,
			courseCount: categoryCourseCount,
			createdAt: courseCategory.createdAt,
			updatedAt: courseCategory.updatedAt,
		})
		.from(courseCategory)
		.leftJoin(course, eq(course.categoryId, courseCategory.id))
		.where(eq(courseCategory.id, categoryId))
		.groupBy(
			courseCategory.id,
			courseCategory.name,
			courseCategory.slug,
			courseCategory.description,
			courseCategory.isActive,
			courseCategory.createdAt,
			courseCategory.updatedAt,
		);

	return category;
};

const selectTagById = async (tagId: string) => {
	const tagCourseCount = count(courseTag.courseId);

	const [tagRecord] = await db
		.select({
			id: tag.id,
			name: tag.name,
			slug: tag.slug,
			courseCount: tagCourseCount,
			createdAt: tag.createdAt,
			updatedAt: tag.updatedAt,
		})
		.from(tag)
		.leftJoin(courseTag, eq(courseTag.tagId, tag.id))
		.where(eq(tag.id, tagId))
		.groupBy(tag.id, tag.name, tag.slug, tag.createdAt, tag.updatedAt);

	return tagRecord;
};

export const listCategoriesService = async (query: ListCategoriesQuery) => {
	const { limit, offset } = getPagination(query);
	const where = getCategoryFilters(query);
	const categoryCourseCount = count(course.id);

	const [totalRow] = await db
		.select({ value: count() })
		.from(courseCategory)
		.where(where);

	const items = await db
		.select({
			id: courseCategory.id,
			name: courseCategory.name,
			slug: courseCategory.slug,
			description: courseCategory.description,
			isActive: courseCategory.isActive,
			courseCount: categoryCourseCount,
			createdAt: courseCategory.createdAt,
			updatedAt: courseCategory.updatedAt,
		})
		.from(courseCategory)
		.leftJoin(course, eq(course.categoryId, courseCategory.id))
		.where(where)
		.groupBy(
			courseCategory.id,
			courseCategory.name,
			courseCategory.slug,
			courseCategory.description,
			courseCategory.isActive,
			courseCategory.createdAt,
			courseCategory.updatedAt,
		)
		.orderBy(
			getCategorySort(query.sortBy, query.sortDirection, categoryCourseCount),
		)
		.limit(limit)
		.offset(offset);

	return {
		items,
		paginations: getPaginations({
			total: totalRow.value,
			limit,
			offset,
			itemCount: items.length,
		}),
	};
};

export const createCategoryService = async (input: CreateCategoryInput) => {
	try {
		const [category] = await db
			.insert(courseCategory)
			.values({
				name: input.name,
				slug: input.slug ?? toSlug(input.name),
				description: input.description,
				isActive: input.isActive ?? true,
			})
			.returning({
				id: courseCategory.id,
				name: courseCategory.name,
				slug: courseCategory.slug,
				description: courseCategory.description,
				isActive: courseCategory.isActive,
				createdAt: courseCategory.createdAt,
				updatedAt: courseCategory.updatedAt,
			});

		return {
			...category,
			courseCount: 0,
		};
	} catch (error) {
		if (isUniqueConstraintError(error)) {
			throw conflictError("Category name or slug already exists");
		}

		throw error;
	}
};

export const updateCategoryService = async (
	categoryId: string,
	input: UpdateCategoryInput,
) => {
	try {
		const [category] = await db
			.update(courseCategory)
			.set(input)
			.where(eq(courseCategory.id, categoryId))
			.returning({ id: courseCategory.id });

		if (!category) {
			throw notFoundError("Category not found");
		}

		const updatedCategory = await selectCategoryById(category.id);

		if (!updatedCategory) {
			throw notFoundError("Category not found");
		}

		return updatedCategory;
	} catch (error) {
		if (isUniqueConstraintError(error)) {
			throw conflictError("Category name or slug already exists");
		}

		throw error;
	}
};

export const deleteCategoryService = async (categoryId: string) => {
	const [affectedCourses] = await db
		.select({ value: count() })
		.from(course)
		.where(eq(course.categoryId, categoryId));

	const [deletedCategory] = await db
		.delete(courseCategory)
		.where(eq(courseCategory.id, categoryId))
		.returning({
			id: courseCategory.id,
			name: courseCategory.name,
			slug: courseCategory.slug,
			description: courseCategory.description,
			isActive: courseCategory.isActive,
			createdAt: courseCategory.createdAt,
			updatedAt: courseCategory.updatedAt,
		});

	if (!deletedCategory) {
		throw notFoundError("Category not found");
	}

	return {
		deletedCount: 1,
		affectedCourseCount: affectedCourses.value,
		category: deletedCategory,
	};
};

export const deleteCategoriesService = async (
	input: DeleteCategoriesInput,
) => {
	const categoryIds = input.categoryIds;

	const existingCategories = await db
		.select({ id: courseCategory.id })
		.from(courseCategory)
		.where(inArray(courseCategory.id, categoryIds));

	if (existingCategories.length !== categoryIds.length) {
		const existingIds = new Set(existingCategories.map((category) => category.id));
		const missingCategoryIds = categoryIds.filter(
			(categoryId) => !existingIds.has(categoryId),
		);

		throw notFoundError("Some categories were not found", {
			missingCategoryIds,
		});
	}

	const [affectedCourses] = await db
		.select({ value: count() })
		.from(course)
		.where(inArray(course.categoryId, categoryIds));

	const deletedCategories = await db
		.delete(courseCategory)
		.where(inArray(courseCategory.id, categoryIds))
		.returning({
			id: courseCategory.id,
			name: courseCategory.name,
			slug: courseCategory.slug,
			description: courseCategory.description,
			isActive: courseCategory.isActive,
			createdAt: courseCategory.createdAt,
			updatedAt: courseCategory.updatedAt,
		});

	return {
		requestedCount: categoryIds.length,
		deletedCount: deletedCategories.length,
		affectedCourseCount: affectedCourses.value,
		categories: deletedCategories,
	};
};

export const listTagsService = async (query: ListTagsQuery) => {
	const { limit, offset } = getPagination(query);
	const where = getTagFilters(query);
	const tagCourseCount = count(courseTag.courseId);

	const [totalRow] = await db.select({ value: count() }).from(tag).where(where);

	const items = await db
		.select({
			id: tag.id,
			name: tag.name,
			slug: tag.slug,
			courseCount: tagCourseCount,
			createdAt: tag.createdAt,
			updatedAt: tag.updatedAt,
		})
		.from(tag)
		.leftJoin(courseTag, eq(courseTag.tagId, tag.id))
		.where(where)
		.groupBy(tag.id, tag.name, tag.slug, tag.createdAt, tag.updatedAt)
		.orderBy(getTagSort(query.sortBy, query.sortDirection, tagCourseCount))
		.limit(limit)
		.offset(offset);

	return {
		items,
		paginations: getPaginations({
			total: totalRow.value,
			limit,
			offset,
			itemCount: items.length,
		}),
	};
};

export const createTagService = async (input: CreateTagInput) => {
	try {
		const [tagRecord] = await db
			.insert(tag)
			.values({
				name: input.name,
				slug: input.slug ?? toSlug(input.name),
			})
			.returning({
				id: tag.id,
				name: tag.name,
				slug: tag.slug,
				createdAt: tag.createdAt,
				updatedAt: tag.updatedAt,
			});

		return {
			...tagRecord,
			courseCount: 0,
		};
	} catch (error) {
		if (isUniqueConstraintError(error)) {
			throw conflictError("Tag name or slug already exists");
		}

		throw error;
	}
};

export const updateTagService = async (
	tagId: string,
	input: UpdateTagInput,
) => {
	try {
		const [tagRecord] = await db
			.update(tag)
			.set(input)
			.where(eq(tag.id, tagId))
			.returning({ id: tag.id });

		if (!tagRecord) {
			throw notFoundError("Tag not found");
		}

		const updatedTag = await selectTagById(tagRecord.id);

		if (!updatedTag) {
			throw notFoundError("Tag not found");
		}

		return updatedTag;
	} catch (error) {
		if (isUniqueConstraintError(error)) {
			throw conflictError("Tag name or slug already exists");
		}

		throw error;
	}
};

export const deleteTagService = async (tagId: string) => {
	const [affectedCourseTags] = await db
		.select({ value: count() })
		.from(courseTag)
		.where(eq(courseTag.tagId, tagId));

	const [deletedTag] = await db
		.delete(tag)
		.where(eq(tag.id, tagId))
		.returning({
			id: tag.id,
			name: tag.name,
			slug: tag.slug,
			createdAt: tag.createdAt,
			updatedAt: tag.updatedAt,
		});

	if (!deletedTag) {
		throw notFoundError("Tag not found");
	}

	return {
		deletedCount: 1,
		affectedCourseTagCount: affectedCourseTags.value,
		tag: deletedTag,
	};
};

export const deleteTagsService = async (input: DeleteTagsInput) => {
	const tagIds = input.tagIds;

	const existingTags = await db
		.select({ id: tag.id })
		.from(tag)
		.where(inArray(tag.id, tagIds));

	if (existingTags.length !== tagIds.length) {
		const existingIds = new Set(existingTags.map((tagRecord) => tagRecord.id));
		const missingTagIds = tagIds.filter((tagId) => !existingIds.has(tagId));

		throw notFoundError("Some tags were not found", {
			missingTagIds,
		});
	}

	const [affectedCourseTags] = await db
		.select({ value: count() })
		.from(courseTag)
		.where(inArray(courseTag.tagId, tagIds));

	const deletedTags = await db
		.delete(tag)
		.where(inArray(tag.id, tagIds))
		.returning({
			id: tag.id,
			name: tag.name,
			slug: tag.slug,
			createdAt: tag.createdAt,
			updatedAt: tag.updatedAt,
		});

	return {
		requestedCount: tagIds.length,
		deletedCount: deletedTags.length,
		affectedCourseTagCount: affectedCourseTags.value,
		tags: deletedTags,
	};
};
