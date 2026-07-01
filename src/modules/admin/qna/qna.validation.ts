import * as v from "valibot";

const trimmedString = v.pipe(v.string(), v.trim());

const dateString = v.pipe(
	trimmedString,
	v.regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD format"),
);

const uuidParam = v.pipe(trimmedString, v.uuid("Id must be a valid UUID"));

const userIdValidation = v.pipe(
	trimmedString,
	v.minLength(1, "User id is required"),
);

const questionStatus = v.union([
	v.literal("open"),
	v.literal("answered"),
	v.literal("closed"),
]);

const paginationNumber = (name: string, max: number) =>
	v.pipe(
		trimmedString,
		v.regex(/^\d+$/, `${name} must be a number`),
		v.check((value) => Number(value) <= max, `${name} must be at most ${max}`),
	);

const listSortDirection = v.union([v.literal("asc"), v.literal("desc")]);

const listQuestionsSortBy = v.union([
	v.literal("latestActivityAt"),
	v.literal("createdAt"),
	v.literal("updatedAt"),
	v.literal("answerCount"),
	v.literal("status"),
]);

export const listQuestionsQuerySchema = v.object({
	status: v.optional(questionStatus),
	courseId: v.optional(uuidParam),
	lessonId: v.optional(uuidParam),
	userId: v.optional(userIdValidation),
	search: v.optional(v.pipe(trimmedString, v.maxLength(120))),
	from: v.optional(dateString),
	to: v.optional(dateString),
	limit: v.optional(paginationNumber("Limit", 100)),
	offset: v.optional(paginationNumber("Offset", 100_000)),
	sortBy: v.optional(listQuestionsSortBy),
	sortDirection: v.optional(listSortDirection),
});

export const questionIdParamsSchema = v.object({
	questionId: uuidParam,
});

export const updateQuestionStatusBodySchema = v.object({
	status: questionStatus,
});

export type ListQuestionsQuery = v.InferOutput<
	typeof listQuestionsQuerySchema
>;
export type QuestionIdParams = v.InferOutput<typeof questionIdParamsSchema>;
export type UpdateQuestionStatusBody = v.InferOutput<
	typeof updateQuestionStatusBodySchema
>;
