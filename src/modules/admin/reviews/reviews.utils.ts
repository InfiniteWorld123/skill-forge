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
	type SQLWrapper,
} from "drizzle-orm";
import {
	course,
	courseReview,
	user,
} from "../../../db/schemas/schema.js";
import type {
	GetReviewsSummaryQuery,
	ListReviewsQuery,
} from "./reviews.validation.js";

type ReviewFilterQuery = Pick<
	ListReviewsQuery | GetReviewsSummaryQuery,
	"rating" | "courseId" | "userId" | "search" | "from" | "to"
>;

type PaginationInput = {
	limit?: string;
	offset?: string;
};

type PaginationOutput = {
	total: number;
	limit: number;
	offset: number;
	hasMore: boolean;
};

export const validationError = (
	result: { success: false; error: unknown },
	c: Context,
) => {
	return c.json({ success: false, errors: result.error }, 400);
};

export const getPagination = (query: PaginationInput) => {
	return {
		limit: query.limit ? Number(query.limit) : 20,
		offset: query.offset ? Number(query.offset) : 0,
	};
};

export const getPaginationMeta = ({
	total,
	limit,
	offset,
	itemCount,
}: {
	total: number;
	limit: number;
	offset: number;
	itemCount: number;
}): PaginationOutput => {
	return {
		total,
		limit,
		offset,
		hasMore: offset + itemCount < total,
	};
};

export const getReviewDateRangeValues = (
	query: Pick<ReviewFilterQuery, "from" | "to">,
) => {
	return {
		from: query.from ? new Date(`${query.from}T00:00:00.000Z`) : undefined,
		to: query.to ? new Date(`${query.to}T23:59:59.999Z`) : undefined,
	};
};

export const getReviewFilters = (query: ReviewFilterQuery) => {
	const filters: SQLWrapper[] = [];

	if (query.rating) {
		filters.push(eq(courseReview.rating, Number(query.rating)));
	}

	if (query.courseId) {
		filters.push(eq(courseReview.courseId, query.courseId));
	}

	if (query.userId) {
		filters.push(eq(courseReview.userId, query.userId));
	}

	if (query.search) {
		const search = `%${query.search}%`;
		const searchFilter = or(
			ilike(courseReview.title, search),
			ilike(courseReview.body, search),
			ilike(user.name, search),
			ilike(user.email, search),
			ilike(course.title, search),
		);

		if (searchFilter) filters.push(searchFilter);
	}

	const { from, to } = getReviewDateRangeValues(query);

	if (from) {
		filters.push(gte(courseReview.createdAt, from));
	}

	if (to) {
		filters.push(lte(courseReview.createdAt, to));
	}

	return filters.length > 0 ? and(...filters) : undefined;
};

export const getListReviewsSort = (
	sortBy: ListReviewsQuery["sortBy"] = "createdAt",
	sortDirection: ListReviewsQuery["sortDirection"] = "desc",
) => {
	const columns = {
		createdAt: courseReview.createdAt,
		updatedAt: courseReview.updatedAt,
		rating: courseReview.rating,
		courseTitle: course.title,
		studentName: user.name,
	};

	const column = columns[sortBy];

	return sortDirection === "asc" ? asc(column) : desc(column);
};

export const getReviewFilterValues = (query: ReviewFilterQuery) => {
	return {
		...(query.rating ? { rating: Number(query.rating) } : {}),
		...(query.courseId ? { courseId: query.courseId } : {}),
		...(query.userId ? { userId: query.userId } : {}),
		...(query.search ? { search: query.search } : {}),
		...(query.from ? { from: query.from } : {}),
		...(query.to ? { to: query.to } : {}),
	};
};
