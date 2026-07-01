import * as v from "valibot";

const trimmedString = v.pipe(v.string(), v.trim());

const requiredName = v.pipe(
	trimmedString,
	v.minLength(1, "Name is required"),
	v.maxLength(120, "Name must be at most 120 characters"),
);

const optionalSlug = v.optional(
	v.pipe(
		trimmedString,
		v.minLength(1, "Slug cannot be empty"),
		v.maxLength(140, "Slug must be at most 140 characters"),
		v.regex(
			/^[a-z0-9]+(?:-[a-z0-9]+)*$/,
			"Slug must use lowercase letters, numbers, and hyphens",
		),
	),
);

const optionalDescription = v.optional(
	v.nullable(
		v.pipe(
			trimmedString,
			v.maxLength(500, "Description must be at most 500 characters"),
		),
	),
);

const uuidParam = v.pipe(trimmedString, v.uuid("Id must be a valid UUID"));

const booleanQuery = v.union([v.literal("true"), v.literal("false")]);

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
	v.literal("isActive"),
	v.literal("courseCount"),
	v.literal("createdAt"),
	v.literal("updatedAt"),
]);

const tagSortBy = v.union([
	v.literal("name"),
	v.literal("slug"),
	v.literal("courseCount"),
	v.literal("createdAt"),
	v.literal("updatedAt"),
]);

export const listCategoriesQuerySchema = v.object({
	search: v.optional(v.pipe(trimmedString, v.maxLength(120))),
	isActive: v.optional(booleanQuery),
	limit: v.optional(paginationNumber("Limit", 100)),
	offset: v.optional(paginationNumber("Offset", 100_000)),
	sortBy: v.optional(categorySortBy),
	sortDirection: v.optional(listSortDirection),
});

export const createCategoryBodySchema = v.object({
	name: requiredName,
	slug: optionalSlug,
	description: optionalDescription,
	isActive: v.optional(v.boolean()),
});

export const updateCategoryParamsSchema = v.object({
	categoryId: uuidParam,
});

export const deleteCategoryParamsSchema = v.object({
	categoryId: uuidParam,
});

export const deleteCategoriesBodySchema = v.object({
	categoryIds: v.pipe(
		v.array(uuidParam),
		v.minLength(1, "At least one category id is required"),
		v.maxLength(100, "You can delete at most 100 categories at once"),
		v.check(
			(categoryIds) => new Set(categoryIds).size === categoryIds.length,
			"Category ids must be unique",
		),
	),
});

export const updateCategoryBodySchema = v.pipe(
	v.partial(
		v.object({
			name: requiredName,
			slug: v.pipe(
				trimmedString,
				v.minLength(1, "Slug cannot be empty"),
				v.maxLength(140, "Slug must be at most 140 characters"),
				v.regex(
					/^[a-z0-9]+(?:-[a-z0-9]+)*$/,
					"Slug must use lowercase letters, numbers, and hyphens",
				),
			),
			description: v.nullable(
				v.pipe(
					trimmedString,
					v.maxLength(500, "Description must be at most 500 characters"),
				),
			),
			isActive: v.boolean(),
		}),
	),
	v.check(
		(input) => Object.values(input).some((value) => value !== undefined),
		"At least one field is required",
	),
);

export const listTagsQuerySchema = v.object({
	search: v.optional(v.pipe(trimmedString, v.maxLength(120))),
	limit: v.optional(paginationNumber("Limit", 100)),
	offset: v.optional(paginationNumber("Offset", 100_000)),
	sortBy: v.optional(tagSortBy),
	sortDirection: v.optional(listSortDirection),
});

export const createTagBodySchema = v.object({
	name: requiredName,
	slug: optionalSlug,
});

export const updateTagParamsSchema = v.object({
	tagId: uuidParam,
});

export const deleteTagParamsSchema = v.object({
	tagId: uuidParam,
});

export const deleteTagsBodySchema = v.object({
	tagIds: v.pipe(
		v.array(uuidParam),
		v.minLength(1, "At least one tag id is required"),
		v.maxLength(100, "You can delete at most 100 tags at once"),
		v.check(
			(tagIds) => new Set(tagIds).size === tagIds.length,
			"Tag ids must be unique",
		),
	),
});

export const updateTagBodySchema = v.pipe(
	v.partial(
		v.object({
			name: requiredName,
			slug: v.pipe(
				trimmedString,
				v.minLength(1, "Slug cannot be empty"),
				v.maxLength(140, "Slug must be at most 140 characters"),
				v.regex(
					/^[a-z0-9]+(?:-[a-z0-9]+)*$/,
					"Slug must use lowercase letters, numbers, and hyphens",
				),
			),
		}),
	),
	v.check(
		(input) => Object.values(input).some((value) => value !== undefined),
		"At least one field is required",
	),
);

export type ListCategoriesQuery = v.InferOutput<
	typeof listCategoriesQuerySchema
>;
export type CreateCategoryInput = v.InferOutput<typeof createCategoryBodySchema>;
export type UpdateCategoryParams = v.InferOutput<
	typeof updateCategoryParamsSchema
>;
export type UpdateCategoryInput = v.InferOutput<typeof updateCategoryBodySchema>;
export type DeleteCategoryParams = v.InferOutput<
	typeof deleteCategoryParamsSchema
>;
export type DeleteCategoriesInput = v.InferOutput<
	typeof deleteCategoriesBodySchema
>;

export type ListTagsQuery = v.InferOutput<typeof listTagsQuerySchema>;
export type CreateTagInput = v.InferOutput<typeof createTagBodySchema>;
export type UpdateTagParams = v.InferOutput<typeof updateTagParamsSchema>;
export type UpdateTagInput = v.InferOutput<typeof updateTagBodySchema>;
export type DeleteTagParams = v.InferOutput<typeof deleteTagParamsSchema>;
export type DeleteTagsInput = v.InferOutput<typeof deleteTagsBodySchema>;
