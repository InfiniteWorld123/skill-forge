import * as v from "valibot";

const trimmedString = v.pipe(v.string(), v.trim());

const uuidParam = v.pipe(trimmedString, v.uuid("Id must be a valid UUID"));

const dateString = v.pipe(
	trimmedString,
	v.regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD format"),
);

const optionalText = (name: string, max: number) =>
	v.optional(
		v.nullable(
			v.pipe(
				trimmedString,
				v.maxLength(max, `${name} must be at most ${max} characters`),
			),
		),
	);

const slug = v.pipe(
	trimmedString,
	v.minLength(1, "Slug is required"),
	v.maxLength(140, "Slug must be at most 140 characters"),
	v.regex(
		/^[a-z0-9]+(?:-[a-z0-9]+)*$/,
		"Slug must use lowercase letters, numbers, and hyphens",
	),
);

const courseStatus = v.union([
	v.literal("draft"),
	v.literal("published"),
	v.literal("archived"),
]);

const courseLevel = v.union([
	v.literal("beginner"),
	v.literal("intermediate"),
	v.literal("advanced"),
]);

const currency = v.union([v.literal("EUR"), v.literal("USD")]);

const numericQuery = (name: string, max: number) =>
	v.pipe(
		trimmedString,
		v.regex(/^\d+$/, `${name} must be a number`),
		v.check((value) => Number(value) <= max, `${name} must be at most ${max}`),
	);

const nonNegativeInteger = (name: string, max: number) =>
	v.pipe(
		v.number(),
		v.integer(`${name} must be an integer`),
		v.minValue(0, `${name} must be at least 0`),
		v.maxValue(max, `${name} must be at most ${max}`),
	);

const listSortDirection = v.union([v.literal("asc"), v.literal("desc")]);

const listCoursesSortBy = v.union([
	v.literal("title"),
	v.literal("status"),
	v.literal("level"),
	v.literal("priceCents"),
	v.literal("createdAt"),
	v.literal("updatedAt"),
	v.literal("publishedAt"),
	v.literal("enrollmentCount"),
	v.literal("reviewCount"),
	v.literal("averageRating"),
	v.literal("revenueCents"),
]);

export const listCoursesQuerySchema = v.object({
	search: v.optional(v.pipe(trimmedString, v.maxLength(120))),
	status: v.optional(courseStatus),
	categoryId: v.optional(uuidParam),
	teacherProfileId: v.optional(uuidParam),
	level: v.optional(courseLevel),
	language: v.optional(v.pipe(trimmedString, v.maxLength(80))),
	minPriceCents: v.optional(numericQuery("Minimum price", 10_000_000)),
	maxPriceCents: v.optional(numericQuery("Maximum price", 10_000_000)),
	currency: v.optional(currency),
	limit: v.optional(numericQuery("Limit", 100)),
	offset: v.optional(numericQuery("Offset", 100_000)),
	sortBy: v.optional(listCoursesSortBy),
	sortDirection: v.optional(listSortDirection),
});

export const courseIdParamsSchema = v.object({
	courseId: uuidParam,
});

export const updateCourseBodySchema = v.pipe(
	v.partial(
		v.object({
			title: v.pipe(
				trimmedString,
				v.minLength(1, "Title is required"),
				v.maxLength(180, "Title must be at most 180 characters"),
			),
			slug,
			shortDescription: optionalText("Short description", 300),
			description: optionalText("Description", 5_000),
			categoryId: v.nullable(uuidParam),
			thumbnailAssetId: v.nullable(uuidParam),
			level: courseLevel,
			language: v.pipe(
				trimmedString,
				v.minLength(1, "Language is required"),
				v.maxLength(80, "Language must be at most 80 characters"),
			),
			priceCents: nonNegativeInteger("Price", 10_000_000),
			currency,
		}),
	),
	v.check(
		(input) => Object.values(input).some((value) => value !== undefined),
		"At least one field is required",
	),
);

export const updateCourseStatusBodySchema = v.object({
	status: courseStatus,
});

export const coursePerformanceQuerySchema = v.object({
	from: v.optional(dateString),
	to: v.optional(dateString),
});

export type ListCoursesQuery = v.InferOutput<typeof listCoursesQuerySchema>;
export type CourseIdParams = v.InferOutput<typeof courseIdParamsSchema>;
export type UpdateCourseBody = v.InferOutput<typeof updateCourseBodySchema>;
export type UpdateCourseStatusBody = v.InferOutput<
	typeof updateCourseStatusBodySchema
>;
export type CoursePerformanceQuery = v.InferOutput<
	typeof coursePerformanceQuerySchema
>;
