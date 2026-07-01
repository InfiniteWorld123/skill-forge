import * as v from "valibot";

const trimmedString = v.pipe(v.string(), v.trim());

const userIdValidation = v.pipe(
	trimmedString,
	v.minLength(1, "User id is required"),
);

const dateString = v.pipe(
	trimmedString,
	v.regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD format"),
);

const booleanQuery = v.union([v.literal("true"), v.literal("false")]);

const roleQuery = v.union([v.literal("admin"), v.literal("user")]);

const paginationNumber = (name: string, max: number) =>
	v.pipe(
		trimmedString,
		v.regex(/^\d+$/, `${name} must be a number`),
		v.check((value) => Number(value) <= max, `${name} must be at most ${max}`),
	);

const listSortDirection = v.union([v.literal("asc"), v.literal("desc")]);

const listUsersSortBy = v.union([
	v.literal("createdAt"),
	v.literal("updatedAt"),
	v.literal("name"),
	v.literal("email"),
	v.literal("role"),
	v.literal("banned"),
	v.literal("enrollmentCount"),
	v.literal("orderCount"),
]);

export const listUsersQuerySchema = v.object({
	search: v.optional(v.pipe(trimmedString, v.maxLength(120))),
	role: v.optional(roleQuery),
	banned: v.optional(booleanQuery),
	from: v.optional(dateString),
	to: v.optional(dateString),
	limit: v.optional(paginationNumber("Limit", 100)),
	offset: v.optional(paginationNumber("Offset", 100_000)),
	sortBy: v.optional(listUsersSortBy),
	sortDirection: v.optional(listSortDirection),
});

export const getUserDetailsParamsSchema = v.object({
	userId: userIdValidation,
});

export const getUserActivityParamsSchema = v.object({
	userId: userIdValidation,
});

export const getUserActivityQuerySchema = v.object({
	limit: v.optional(paginationNumber("Limit", 100)),
});

export type ListUsersQuery = v.InferOutput<typeof listUsersQuerySchema>;
export type GetUserDetailsParams = v.InferOutput<
	typeof getUserDetailsParamsSchema
>;
export type GetUserActivityParams = v.InferOutput<
	typeof getUserActivityParamsSchema
>;
export type GetUserActivityQuery = v.InferOutput<
	typeof getUserActivityQuerySchema
>;
