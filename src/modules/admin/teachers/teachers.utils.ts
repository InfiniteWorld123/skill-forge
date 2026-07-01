import type { Context } from "hono";
import {
	and,
	asc,
	desc,
	eq,
	gte,
	ilike,
	lte,
	or,
	type SQL,
	type SQLWrapper,
} from "drizzle-orm";
import {
	teacherProfile,
	user,
} from "../../../db/schemas/schema.js";
import type { ListTeachersQuery } from "./teachers.validation.js";

type PaginationInput = {
	limit?: string;
	offset?: string;
};

type TeacherSortColumns = {
	courseCount: SQL<number>;
	enrollmentCount: SQL<number>;
	averageRating: SQL<number>;
};

export const validationError = (
	result: { success: false; error: unknown },
	c: Context,
) => {
	return c.json({ success: false, errors: result.error }, 400);
};

export const getTeacherPagination = (query: PaginationInput) => {
	return {
		limit: query.limit ? Number(query.limit) : 20,
		offset: query.offset ? Number(query.offset) : 0,
	};
};

export const getTeacherPaginationMeta = ({
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
		hasNextPage: offset + itemCount < total,
		hasPreviousPage: offset > 0,
	};
};

export const getTeacherDateRange = (query: ListTeachersQuery) => {
	const from = query.from ? new Date(query.from) : undefined;
	const to = query.to ? new Date(query.to) : undefined;

	if (from) from.setHours(0, 0, 0, 0);
	if (to) to.setHours(23, 59, 59, 999);

	return { from, to };
};

export const getTeacherFilters = (query: ListTeachersQuery) => {
	const filters: SQLWrapper[] = [];
	const { from, to } = getTeacherDateRange(query);

	if (query.search) {
		const search = `%${query.search}%`;
		const searchFilter = or(
			ilike(user.name, search),
			ilike(user.email, search),
			ilike(teacherProfile.headline, search),
			ilike(teacherProfile.expertise, search),
		);

		if (searchFilter) filters.push(searchFilter);
	}

	if (query.isPublic) {
		filters.push(eq(teacherProfile.isPublic, query.isPublic === "true"));
	}

	if (from) {
		filters.push(gte(teacherProfile.createdAt, from));
	}

	if (to) {
		filters.push(lte(teacherProfile.createdAt, to));
	}

	return filters.length > 0 ? and(...filters) : undefined;
};

export const getTeacherSort = (
	sortColumns: TeacherSortColumns,
	sortBy: ListTeachersQuery["sortBy"] = "createdAt",
	sortDirection: ListTeachersQuery["sortDirection"] = "desc",
) => {
	const columns = {
		createdAt: teacherProfile.createdAt,
		updatedAt: teacherProfile.updatedAt,
		name: user.name,
		courseCount: sortColumns.courseCount,
		enrollmentCount: sortColumns.enrollmentCount,
		averageRating: sortColumns.averageRating,
	};

	const column = columns[sortBy];

	return sortDirection === "asc" ? asc(column) : desc(column);
};
