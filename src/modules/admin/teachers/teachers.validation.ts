import * as v from "valibot";

const trimmedString = v.pipe(v.string(), v.trim());

const uuidParam = v.pipe(trimmedString, v.uuid("Id must be a valid UUID"));

const dateString = v.pipe(
	trimmedString,
	v.regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD format"),
);

const booleanQuery = v.union([v.literal("true"), v.literal("false")]);

const paginationNumber = (name: string, max: number) =>
	v.pipe(
		trimmedString,
		v.regex(/^\d+$/, `${name} must be a number`),
		v.check((value) => Number(value) <= max, `${name} must be at most ${max}`),
	);

const listSortDirection = v.union([v.literal("asc"), v.literal("desc")]);

const teacherSortBy = v.union([
	v.literal("createdAt"),
	v.literal("updatedAt"),
	v.literal("name"),
	v.literal("courseCount"),
	v.literal("enrollmentCount"),
	v.literal("averageRating"),
]);

export const listTeachersQuerySchema = v.object({
	search: v.optional(v.pipe(trimmedString, v.maxLength(120))),
	isPublic: v.optional(booleanQuery),
	from: v.optional(dateString),
	to: v.optional(dateString),
	limit: v.optional(paginationNumber("Limit", 100)),
	offset: v.optional(paginationNumber("Offset", 100_000)),
	sortBy: v.optional(teacherSortBy),
	sortDirection: v.optional(listSortDirection),
});

export const teacherProfileParamsSchema = v.object({
	teacherProfileId: uuidParam,
});

export const updateTeacherVisibilityBodySchema = v.object({
	isPublic: v.boolean(),
});

export type ListTeachersQuery = v.InferOutput<
	typeof listTeachersQuerySchema
>;

export type TeacherProfileParams = v.InferOutput<
	typeof teacherProfileParamsSchema
>;

export type UpdateTeacherVisibilityInput = v.InferOutput<
	typeof updateTeacherVisibilityBodySchema
>;
