import * as v from "valibot";

const trimmedString = v.pipe(v.string(), v.trim());

const dateString = v.pipe(
	trimmedString,
	v.regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD format"),
);

const positiveNumberString = (name: string, max: number) =>
	v.pipe(
		trimmedString,
		v.regex(/^\d+$/, `${name} must be a number`),
		v.check((value) => Number(value) >= 1, `${name} must be at least 1`),
		v.check((value) => Number(value) <= max, `${name} must be at most ${max}`),
	);

const dateRangeIsValid = <T extends { from?: string; to?: string }>(query: T) => {
	if (!query.from || !query.to) return true;

	return query.from <= query.to;
};

const mediaKind = v.union([
	v.literal("image"),
	v.literal("video"),
	v.literal("document"),
	v.literal("certificate_pdf"),
	v.literal("other"),
]);

const mediaAssetSortBy = v.union([
	v.literal("createdAt"),
	v.literal("sizeBytes"),
	v.literal("kind"),
	v.literal("provider"),
	v.literal("mimeType"),
	v.literal("usageCount"),
]);

const sortDirection = v.union([v.literal("asc"), v.literal("desc")]);

const queryDateRangeMessage = "From date must be before or equal to to date";

export const listMediaAssetsQuerySchema = v.pipe(
	v.object({
		kind: v.optional(mediaKind),
		provider: v.optional(v.pipe(trimmedString, v.minLength(1))),
		ownerId: v.optional(v.pipe(trimmedString, v.minLength(1))),
		search: v.optional(v.pipe(trimmedString, v.maxLength(160))),
		from: v.optional(dateString),
		to: v.optional(dateString),
		page: v.optional(positiveNumberString("Page", 100_000)),
		limit: v.optional(positiveNumberString("Limit", 100)),
		sortBy: v.optional(mediaAssetSortBy),
		sortDirection: v.optional(sortDirection),
	}),
	v.check(dateRangeIsValid, queryDateRangeMessage),
);

export const getMediaAssetDetailsParamsSchema = v.object({
	assetId: v.pipe(trimmedString, v.uuid("Asset id must be a valid UUID")),
});

export type ListMediaAssetsQuery = v.InferOutput<
	typeof listMediaAssetsQuerySchema
>;

export type GetMediaAssetDetailsParams = v.InferOutput<
	typeof getMediaAssetDetailsParamsSchema
>;
