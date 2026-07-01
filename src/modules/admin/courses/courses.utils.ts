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
	courseCategory,
	teacherProfile,
	user,
} from "../../../db/schemas/schema.js";
import type {
	CoursePerformanceQuery,
	ListCoursesQuery,
} from "./courses.validation.js";

type PaginationInput = {
	limit?: string;
	offset?: string;
};

type CourseSortColumns = {
	enrollmentCount: SQL<number>;
	reviewCount: SQL<number>;
	averageRating: SQL<number>;
	revenueCents: SQL<number>;
};

type CurriculumSectionRow = {
	id: string;
	title: string;
	description: string | null;
	position: number;
	createdAt: Date;
	updatedAt: Date;
};

type CurriculumLessonRow = {
	id: string;
	sectionId: string;
	title: string;
	description: string | null;
	type: "video" | "text" | "quiz";
	textContent: string | null;
	durationSeconds: number | null;
	position: number;
	isPreview: boolean;
	createdAt: Date;
	updatedAt: Date;
	videoAsset: {
		id: string | null;
		url: string | null;
		mimeType: string | null;
		sizeBytes: number | null;
	} | null;
};

type CurriculumQuestionRow = {
	id: string;
	lessonId: string;
	prompt: string;
	explanation: string | null;
	position: number;
	createdAt: Date;
	updatedAt: Date;
};

type CurriculumOptionRow = {
	id: string;
	questionId: string;
	text: string;
	isCorrect: boolean;
	position: number;
	createdAt: Date;
	updatedAt: Date;
};

export const validationError = (
	result: { success: false; error: unknown },
	c: Context,
) => {
	return c.json({ success: false, errors: result.error }, 400);
};

export const getCoursePagination = (query: PaginationInput) => {
	return {
		limit: query.limit ? Number(query.limit) : 20,
		offset: query.offset ? Number(query.offset) : 0,
	};
};

export const getCoursePaginationMeta = ({
	count,
	limit,
	offset,
}: {
	count: number;
	limit: number;
	offset: number;
}) => {
	return {
		limit,
		offset,
		count,
		hasNext: offset + limit < count,
		hasPrev: offset > 0,
	};
};

export const getCourseFilters = (query: ListCoursesQuery) => {
	const filters: SQLWrapper[] = [];

	if (query.search) {
		const search = `%${query.search}%`;
		const searchFilter = or(
			ilike(course.title, search),
			ilike(course.slug, search),
			ilike(user.name, search),
			ilike(user.email, search),
			ilike(courseCategory.name, search),
			ilike(teacherProfile.headline, search),
		);

		if (searchFilter) filters.push(searchFilter);
	}

	if (query.status) {
		filters.push(eq(course.status, query.status));
	}

	if (query.categoryId) {
		filters.push(eq(course.categoryId, query.categoryId));
	}

	if (query.teacherProfileId) {
		filters.push(eq(course.teacherProfileId, query.teacherProfileId));
	}

	if (query.level) {
		filters.push(eq(course.level, query.level));
	}

	if (query.language) {
		filters.push(eq(course.language, query.language));
	}

	if (query.currency) {
		filters.push(eq(course.currency, query.currency));
	}

	if (query.minPriceCents) {
		filters.push(gte(course.priceCents, Number(query.minPriceCents)));
	}

	if (query.maxPriceCents) {
		filters.push(lte(course.priceCents, Number(query.maxPriceCents)));
	}

	return filters.length > 0 ? and(...filters) : undefined;
};

export const getCourseSort = (
	sortColumns: CourseSortColumns,
	sortBy: ListCoursesQuery["sortBy"] = "createdAt",
	sortDirection: ListCoursesQuery["sortDirection"] = "desc",
) => {
	const columns = {
		title: course.title,
		status: course.status,
		level: course.level,
		priceCents: course.priceCents,
		createdAt: course.createdAt,
		updatedAt: course.updatedAt,
		publishedAt: course.publishedAt,
		enrollmentCount: sortColumns.enrollmentCount,
		reviewCount: sortColumns.reviewCount,
		averageRating: sortColumns.averageRating,
		revenueCents: sortColumns.revenueCents,
	};

	const column = columns[sortBy];

	return sortDirection === "asc" ? asc(column) : desc(column);
};

export const getCourseFilterValues = (query: ListCoursesQuery) => {
	return {
		search: query.search ?? null,
		status: query.status ?? null,
		categoryId: query.categoryId ?? null,
		teacherProfileId: query.teacherProfileId ?? null,
		level: query.level ?? null,
		language: query.language ?? null,
		minPriceCents: query.minPriceCents ? Number(query.minPriceCents) : null,
		maxPriceCents: query.maxPriceCents ? Number(query.maxPriceCents) : null,
		currency: query.currency ?? null,
	};
};

export const getCoursePerformanceDateRange = (
	query: CoursePerformanceQuery,
) => {
	return {
		from: query.from ? new Date(`${query.from}T00:00:00.000Z`) : undefined,
		to: query.to ? new Date(`${query.to}T23:59:59.999Z`) : undefined,
	};
};

export const getCourseDateFilters = (
	column: SQLWrapper,
	query: CoursePerformanceQuery,
) => {
	const filters: SQLWrapper[] = [];
	const { from, to } = getCoursePerformanceDateRange(query);

	if (from) {
		filters.push(gte(column, from));
	}

	if (to) {
		filters.push(lte(column, to));
	}

	return filters;
};

export const getCoursePerformanceFilterValues = (
	query: CoursePerformanceQuery,
) => {
	return {
		from: query.from ?? null,
		to: query.to ?? null,
	};
};

export const calculateCompletionRate = ({
	completed,
	total,
}: {
	completed: number;
	total: number;
}) => {
	if (total === 0) return 0;

	return completed / total;
};

export const createEmptyRatingDistribution = () => ({
	1: 0,
	2: 0,
	3: 0,
	4: 0,
	5: 0,
});

export const isUniqueConstraintError = (error: unknown) => {
	if (!error || typeof error !== "object") return false;

	const dbError = error as { code?: unknown; cause?: { code?: unknown } };

	return dbError.code === "23505" || dbError.cause?.code === "23505";
};

export const isForeignKeyConstraintError = (error: unknown) => {
	if (!error || typeof error !== "object") return false;

	const dbError = error as { code?: unknown; cause?: { code?: unknown } };

	return dbError.code === "23503" || dbError.cause?.code === "23503";
};

export const nullableAsset = <
	T extends {
		id: string | null;
		url: string | null;
		mimeType: string | null;
		sizeBytes: number | null;
	},
>(
	asset: T | null,
) => {
	if (!asset?.id) return null;

	return {
		id: asset.id,
		url: asset.url,
		mimeType: asset.mimeType,
		sizeBytes: asset.sizeBytes,
	};
};

export const buildCourseCurriculum = ({
	sections,
	lessons,
	questions,
	options,
}: {
	sections: CurriculumSectionRow[];
	lessons: CurriculumLessonRow[];
	questions: CurriculumQuestionRow[];
	options: CurriculumOptionRow[];
}) => {
	const optionsByQuestionId = new Map<string, CurriculumOptionRow[]>();
	const questionsByLessonId = new Map<string, CurriculumQuestionRow[]>();
	const lessonsBySectionId = new Map<string, CurriculumLessonRow[]>();

	for (const option of options) {
		const existingOptions = optionsByQuestionId.get(option.questionId) ?? [];
		existingOptions.push(option);
		optionsByQuestionId.set(option.questionId, existingOptions);
	}

	for (const question of questions) {
		const existingQuestions = questionsByLessonId.get(question.lessonId) ?? [];
		existingQuestions.push(question);
		questionsByLessonId.set(question.lessonId, existingQuestions);
	}

	for (const lesson of lessons) {
		const existingLessons = lessonsBySectionId.get(lesson.sectionId) ?? [];
		existingLessons.push(lesson);
		lessonsBySectionId.set(lesson.sectionId, existingLessons);
	}

	return sections.map((section) => ({
		id: section.id,
		title: section.title,
		description: section.description,
		position: section.position,
		createdAt: section.createdAt,
		updatedAt: section.updatedAt,
		lessons: (lessonsBySectionId.get(section.id) ?? []).map((lesson) => ({
			id: lesson.id,
			title: lesson.title,
			description: lesson.description,
			type: lesson.type,
			textContent: lesson.textContent,
			durationSeconds: lesson.durationSeconds,
			position: lesson.position,
			isPreview: lesson.isPreview,
			createdAt: lesson.createdAt,
			updatedAt: lesson.updatedAt,
			videoAsset: nullableAsset(lesson.videoAsset),
			quiz: {
				questions: (questionsByLessonId.get(lesson.id) ?? []).map(
					(question) => ({
						id: question.id,
						prompt: question.prompt,
						explanation: question.explanation,
						position: question.position,
						createdAt: question.createdAt,
						updatedAt: question.updatedAt,
						options: (optionsByQuestionId.get(question.id) ?? []).map(
							(option) => ({
								id: option.id,
								text: option.text,
								isCorrect: option.isCorrect,
								position: option.position,
								createdAt: option.createdAt,
								updatedAt: option.updatedAt,
							}),
						),
					}),
				),
			},
		})),
	}));
};
