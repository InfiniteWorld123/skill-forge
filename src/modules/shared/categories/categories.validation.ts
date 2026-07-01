import * as v from "valibot";

const trimmedString = v.pipe(v.string(), v.trim());

const paginationNumber = (name: string, max: number) =>
	v.pipe(
		trimmedString,
		v.regex(/^\d+$/, `${name} must be a number`),
		v.check((value) => Number(value) <= max, `${name} must be at most ${max}`),
	);

const listSortDirection = v.union([v.literal("asc"), v.literal("desc")]);

const categorySortBy = v.union([
	v.literal("name"),
	v.literal("slug"),
	v.literal("courseCount"),
]);

const tagSortBy = v.union([
	v.literal("name"),
	v.literal("slug"),
	v.literal("courseCount"),
]);

export const listCategoriesQuerySchema = v.object({
	search: v.optional(v.pipe(trimmedString, v.maxLength(120))),
	limit: v.optional(paginationNumber("Limit", 100)),
	offset: v.optional(paginationNumber("Offset", 100_000)),
	sortBy: v.optional(categorySortBy),
	sortDirection: v.optional(listSortDirection),
});

export const listTagsQuerySchema = v.object({
	search: v.optional(v.pipe(trimmedString, v.maxLength(120))),
	limit: v.optional(paginationNumber("Limit", 100)),
	offset: v.optional(paginationNumber("Offset", 100_000)),
	sortBy: v.optional(tagSortBy),
	sortDirection: v.optional(listSortDirection),
});

export type ListCategoriesQuery = v.InferOutput<
	typeof listCategoriesQuerySchema
>;

export type ListTagsQuery = v.InferOutput<typeof listTagsQuerySchema>;
