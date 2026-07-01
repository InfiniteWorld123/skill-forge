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

const listCertificatesSortBy = v.union([
	v.literal("issuedAt"),
	v.literal("createdAt"),
	v.literal("certificateCode"),
	v.literal("studentName"),
	v.literal("courseTitle"),
]);

export const listCertificatesQuerySchema = v.object({
	search: v.optional(v.pipe(trimmedString, v.maxLength(120))),
	courseId: v.optional(uuidParam),
	userId: v.optional(v.pipe(trimmedString, v.minLength(1, "User id is required"))),
	from: v.optional(dateString),
	to: v.optional(dateString),
	hasPdf: v.optional(booleanQuery),
	limit: v.optional(paginationNumber("Limit", 100)),
	offset: v.optional(paginationNumber("Offset", 100_000)),
	sortBy: v.optional(listCertificatesSortBy),
	sortDirection: v.optional(listSortDirection),
});

export const verifyCertificateParamsSchema = v.object({
	certificateCode: v.pipe(
		trimmedString,
		v.minLength(1, "Certificate code is required"),
	),
});

export const getCertificateDetailsParamsSchema = v.object({
	certificateId: uuidParam,
});

export type ListCertificatesQuery = v.InferOutput<
	typeof listCertificatesQuerySchema
>;

export type VerifyCertificateParams = v.InferOutput<
	typeof verifyCertificateParamsSchema
>;

export type GetCertificateDetailsParams = v.InferOutput<
	typeof getCertificateDetailsParamsSchema
>;
