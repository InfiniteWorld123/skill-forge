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

const ratingQuery = v.union([
	v.literal("1"),
	v.literal("2"),
	v.literal("3"),
	v.literal("4"),
	v.literal("5"),
]);

const paginationNumber = (name: string, max: number) =>
	v.pipe(
		trimmedString,
		v.regex(/^\d+$/, `${name} must be a number`),
		v.check((value) => Number(value) <= max, `${name} must be at most ${max}`),
	);

const listSortDirection = v.union([v.literal("asc"), v.literal("desc")]);

const listReviewsSortBy = v.union([
	v.literal("createdAt"),
	v.literal("updatedAt"),
	v.literal("rating"),
	v.literal("courseTitle"),
	v.literal("studentName"),
]);

const reviewFilterSchema = v.object({
	rating: v.optional(ratingQuery),
	courseId: v.optional(uuidParam),
	userId: v.optional(userIdValidation),
	search: v.optional(v.pipe(trimmedString, v.maxLength(120))),
	from: v.optional(dateString),
	to: v.optional(dateString),
});

export const listReviewsQuerySchema = v.object({
	rating: v.optional(ratingQuery),
	courseId: v.optional(uuidParam),
	userId: v.optional(userIdValidation),
	search: v.optional(v.pipe(trimmedString, v.maxLength(120))),
	from: v.optional(dateString),
	to: v.optional(dateString),
	limit: v.optional(paginationNumber("Limit", 100)),
	offset: v.optional(paginationNumber("Offset", 100_000)),
	sortBy: v.optional(listReviewsSortBy),
	sortDirection: v.optional(listSortDirection),
});

export const getReviewsSummaryQuerySchema = reviewFilterSchema;

export const getReviewDetailsParamsSchema = v.object({
	reviewId: uuidParam,
});

export type ListReviewsQuery = v.InferOutput<typeof listReviewsQuerySchema>;
export type GetReviewsSummaryQuery = v.InferOutput<
	typeof getReviewsSummaryQuerySchema
>;
export type GetReviewDetailsParams = v.InferOutput<
	typeof getReviewDetailsParamsSchema
>;
