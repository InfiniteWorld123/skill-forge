import * as v from "valibot";

const trimmedString = v.pipe(v.string(), v.trim());

const isValidDateString = (value: string) => {
	const [year, month, day] = value.split("-").map(Number);
	const date = new Date(Date.UTC(year, month - 1, day));

	return (
		date.getUTCFullYear() === year &&
		date.getUTCMonth() === month - 1 &&
		date.getUTCDate() === day
	);
};

const uuidParam = v.pipe(trimmedString, v.uuid("Id must be a valid UUID"));

const requiredUserId = v.pipe(
	trimmedString,
	v.minLength(1, "User id is required"),
);

const dateString = v.pipe(
	trimmedString,
	v.regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD format"),
	v.check(isValidDateString, "Date must be a valid calendar date"),
);

const dateTimeString = v.pipe(
	trimmedString,
	v.regex(
		/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/,
		"completedAt must be an ISO datetime",
	),
	v.check(
		(value) => !Number.isNaN(Date.parse(value)),
		"completedAt must be a valid date",
	),
);

const paginationNumber = (name: string, max: number) =>
	v.pipe(
		trimmedString,
		v.regex(/^\d+$/, `${name} must be a number`),
		v.check((value) => Number(value) <= max, `${name} must be at most ${max}`),
	);

const enrollmentStatus = v.union([
	v.literal("active"),
	v.literal("completed"),
	v.literal("refunded"),
	v.literal("revoked"),
]);

const sortDirection = v.union([v.literal("asc"), v.literal("desc")]);

const enrollmentSortBy = v.union([
	v.literal("enrolledAt"),
	v.literal("completedAt"),
	v.literal("updatedAt"),
	v.literal("status"),
	v.literal("studentName"),
	v.literal("courseTitle"),
]);

export const listEnrollmentsQuerySchema = v.pipe(
	v.object({
		search: v.optional(v.pipe(trimmedString, v.maxLength(120))),
		status: v.optional(enrollmentStatus),
		courseId: v.optional(uuidParam),
		userId: v.optional(requiredUserId),
		from: v.optional(dateString),
		to: v.optional(dateString),
		limit: v.optional(paginationNumber("Limit", 100)),
		offset: v.optional(paginationNumber("Offset", 100_000)),
		sortBy: v.optional(enrollmentSortBy),
		sortDirection: v.optional(sortDirection),
	}),
	v.check(
		(query) => !query.from || !query.to || query.from <= query.to,
		"from must be before or equal to to",
	),
);

export const enrollmentIdParamsSchema = v.object({
	enrollmentId: uuidParam,
});

export const updateEnrollmentStatusBodySchema = v.object({
	status: enrollmentStatus,
	completedAt: v.optional(v.nullable(dateTimeString)),
});

export type ListEnrollmentsQuery = v.InferOutput<
	typeof listEnrollmentsQuerySchema
>;

export type EnrollmentIdParams = v.InferOutput<
	typeof enrollmentIdParamsSchema
>;

export type UpdateEnrollmentStatusInput = v.InferOutput<
	typeof updateEnrollmentStatusBodySchema
>;
