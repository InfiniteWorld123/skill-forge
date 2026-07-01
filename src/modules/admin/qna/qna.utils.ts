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
	course,
	courseSection,
	lesson,
	lessonQuestion,
	user,
} from "../../../db/schemas/schema.js";
import type { ListQuestionsQuery } from "./qna.validation.js";

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

export const getLatestActivityDateRangeValues = (
	query: Pick<ListQuestionsQuery, "from" | "to">,
) => {
	return {
		from: query.from ? new Date(`${query.from}T00:00:00.000Z`) : undefined,
		to: query.to ? new Date(`${query.to}T23:59:59.999Z`) : undefined,
	};
};

export const getQuestionFilters = (
	query: ListQuestionsQuery,
	latestActivityAt: SQL<Date>,
) => {
	const filters: SQLWrapper[] = [];

	if (query.status) {
		filters.push(eq(lessonQuestion.status, query.status));
	}

	if (query.courseId) {
		filters.push(eq(course.id, query.courseId));
	}

	if (query.lessonId) {
		filters.push(eq(lessonQuestion.lessonId, query.lessonId));
	}

	if (query.userId) {
		filters.push(eq(lessonQuestion.userId, query.userId));
	}

	if (query.search) {
		const search = `%${query.search}%`;
		const searchFilter = or(
			ilike(lessonQuestion.title, search),
			ilike(lessonQuestion.body, search),
			ilike(user.name, search),
			ilike(user.email, search),
			ilike(lesson.title, search),
			ilike(course.title, search),
		);

		if (searchFilter) filters.push(searchFilter);
	}

	const { from, to } = getLatestActivityDateRangeValues(query);

	if (from) {
		filters.push(gte(latestActivityAt, from));
	}

	if (to) {
		filters.push(lte(latestActivityAt, to));
	}

	return filters.length > 0 ? and(...filters) : undefined;
};

export const getListQuestionsSort = (
	sortBy: ListQuestionsQuery["sortBy"] = "latestActivityAt",
	sortDirection: ListQuestionsQuery["sortDirection"] = "desc",
	latestActivityAt: SQL<Date>,
	answerCount: SQL<number>,
) => {
	const columns = {
		latestActivityAt,
		createdAt: lessonQuestion.createdAt,
		updatedAt: lessonQuestion.updatedAt,
		answerCount,
		status: lessonQuestion.status,
	};

	const column = columns[sortBy];

	return sortDirection === "asc" ? asc(column) : desc(column);
};

export const getQuestionFilterValues = (query: ListQuestionsQuery) => {
	return {
		...(query.status ? { status: query.status } : {}),
		...(query.courseId ? { courseId: query.courseId } : {}),
		...(query.lessonId ? { lessonId: query.lessonId } : {}),
		...(query.userId ? { userId: query.userId } : {}),
		...(query.search ? { search: query.search } : {}),
		...(query.from ? { from: query.from } : {}),
		...(query.to ? { to: query.to } : {}),
	};
};

export const createBodyPreview = (body: string, maxLength = 180) => {
	const normalizedBody = body.replace(/\s+/g, " ").trim();

	if (normalizedBody.length <= maxLength) {
		return normalizedBody;
	}

	return `${normalizedBody.slice(0, maxLength - 1).trimEnd()}...`;
};
