import {
	and,
	asc,
	count,
	desc,
	eq,
	ilike,
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
import type {
	ListCategoriesQuery,
	ListTagsQuery,
} from "./categories.validation.js";

type PaginationInput = {
	limit?: string;
	offset?: string;
};

const getPagination = (query: PaginationInput) => {
	return {
		limit: query.limit ? Number(query.limit) : 20,
		offset: query.offset ? Number(query.offset) : 0,
	};
};

const getPaginationMeta = ({
	total,
	limit,
	offset,
	itemCount,
}: {
	total: number;
	limit: number;
	offset: number;
	itemCount: number;
}) => {
	return {
		total,
		limit,
		offset,
		count: itemCount,
		hasNextPage: offset + itemCount < total,
		hasPreviousPage: offset > 0,
	};
};

const getCategoryFilters = (query: ListCategoriesQuery) => {
	const filters: SQLWrapper[] = [eq(courseCategory.isActive, true)];

	if (query.search) {
		const search = `%${query.search}%`;
		const searchFilter = or(
			ilike(courseCategory.name, search),
			ilike(courseCategory.slug, search),
		);

		if (searchFilter) filters.push(searchFilter);
	}

	return and(...filters);
};

const getTagFilters = (query: ListTagsQuery) => {
	if (!query.search) return undefined;

	const search = `%${query.search}%`;
	return or(ilike(tag.name, search), ilike(tag.slug, search));
};

const getCategorySort = (
	sortBy: ListCategoriesQuery["sortBy"] = "name",
	sortDirection: ListCategoriesQuery["sortDirection"] = "asc",
	courseCount: SQL<number>,
) => {
	const columns = {
		name: courseCategory.name,
		slug: courseCategory.slug,
		courseCount,
	};
	const column = columns[sortBy];

	return sortDirection === "asc" ? asc(column) : desc(column);
};

const getTagSort = (
	sortBy: ListTagsQuery["sortBy"] = "name",
	sortDirection: ListTagsQuery["sortDirection"] = "asc",
	courseCount: SQL<number>,
) => {
	const columns = {
		name: tag.name,
		slug: tag.slug,
		courseCount,
	};
	const column = columns[sortBy];

	return sortDirection === "asc" ? asc(column) : desc(column);
};

export const listSharedCategoriesService = async (
	query: ListCategoriesQuery,
) => {
	const { limit, offset } = getPagination(query);
	const where = getCategoryFilters(query);
	const publishedCourseCount = count(course.id);

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
			courseCount: publishedCourseCount,
		})
		.from(courseCategory)
		.leftJoin(
			course,
			and(
				eq(course.categoryId, courseCategory.id),
				eq(course.status, "published"),
			),
		)
		.where(where)
		.groupBy(
			courseCategory.id,
			courseCategory.name,
			courseCategory.slug,
			courseCategory.description,
		)
		.orderBy(
			getCategorySort(query.sortBy, query.sortDirection, publishedCourseCount),
		)
		.limit(limit)
		.offset(offset);

	return {
		items,
		pagination: getPaginationMeta({
			total: totalRow.value,
			limit,
			offset,
			itemCount: items.length,
		}),
	};
};

export const listSharedTagsService = async (query: ListTagsQuery) => {
	const { limit, offset } = getPagination(query);
	const where = getTagFilters(query);
	const publishedCourseCount = count(course.id);

	const [totalRow] = await db
		.select({ value: count() })
		.from(tag)
		.where(where);

	const items = await db
		.select({
			id: tag.id,
			name: tag.name,
			slug: tag.slug,
			courseCount: publishedCourseCount,
		})
		.from(tag)
		.leftJoin(courseTag, eq(courseTag.tagId, tag.id))
		.leftJoin(
			course,
			and(eq(course.id, courseTag.courseId), eq(course.status, "published")),
		)
		.where(where)
		.groupBy(tag.id, tag.name, tag.slug)
		.orderBy(getTagSort(query.sortBy, query.sortDirection, publishedCourseCount))
		.limit(limit)
		.offset(offset);

	return {
		items,
		pagination: getPaginationMeta({
			total: totalRow.value,
			limit,
			offset,
			itemCount: items.length,
		}),
	};
};
