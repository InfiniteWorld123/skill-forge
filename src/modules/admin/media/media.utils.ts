import type { Context } from "hono";
import {
	and,
	asc,
	desc,
	eq,
	gte,
	ilike,
	lte,
	or,
	sql,
	type SQL,
	type SQLWrapper,
} from "drizzle-orm";
import {
	certificate,
	course,
	lesson,
	mediaAsset,
	user,
} from "../../../db/schemas/schema.js";
import type { ListMediaAssetsQuery } from "./media.validation.js";

type MediaAssetDateRangeQuery = Pick<ListMediaAssetsQuery, "from" | "to">;

type UsageCountInput = {
	courseThumbnailCount: number | string | null;
	lessonVideoCount: number | string | null;
	certificatePdfCount: number | string | null;
};

export const validationError = (
	result: { success: boolean; error?: unknown },
	c: Context,
) => {
	return c.json({ success: false, errors: result.error }, 400);
};

export const getMediaAssetDateRange = (query: MediaAssetDateRangeQuery) => {
	const from = query.from ? new Date(query.from) : undefined;
	const to = query.to ? new Date(query.to) : undefined;

	if (from) from.setHours(0, 0, 0, 0);
	if (to) to.setHours(23, 59, 59, 999);

	return { from, to };
};

export const getMediaAssetPagination = (
	query: Pick<ListMediaAssetsQuery, "page" | "limit">,
) => {
	const page = query.page ? Number(query.page) : 1;
	const limit = query.limit ? Number(query.limit) : 20;

	return {
		page,
		limit,
		offset: (page - 1) * limit,
	};
};

export const getMediaAssetPaginationMeta = ({
	page,
	limit,
	total,
}: {
	page: number;
	limit: number;
	total: number;
}) => {
	const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

	return {
		page,
		limit,
		total,
		totalPages,
		hasNext: page * limit < total,
		hasPrev: page > 1,
	};
};

export const getMediaAssetUsageCountSql = () => sql<number>`(
	(
		select count(*)::int
		from ${course}
		where ${course.thumbnailAssetId} = ${mediaAsset.id}
	) + (
		select count(*)::int
		from ${lesson}
		where ${lesson.videoAssetId} = ${mediaAsset.id}
	) + (
		select count(*)::int
		from ${certificate}
		where ${certificate.pdfAssetId} = ${mediaAsset.id}
	)
)`;

export const getMediaAssetFilters = (
	query: ListMediaAssetsQuery,
	dateRange: ReturnType<typeof getMediaAssetDateRange>,
) => {
	const filters: SQLWrapper[] = [];

	if (query.kind) filters.push(eq(mediaAsset.kind, query.kind));
	if (query.provider) filters.push(eq(mediaAsset.provider, query.provider));
	if (query.ownerId) filters.push(eq(mediaAsset.ownerId, query.ownerId));
	if (dateRange.from) filters.push(gte(mediaAsset.createdAt, dateRange.from));
	if (dateRange.to) filters.push(lte(mediaAsset.createdAt, dateRange.to));

	if (query.search) {
		const search = `%${query.search}%`;
		const searchFilter = or(
			ilike(mediaAsset.providerKey, search),
			ilike(mediaAsset.url, search),
			ilike(mediaAsset.mimeType, search),
			ilike(user.name, search),
			ilike(user.email, search),
		);

		if (searchFilter) filters.push(searchFilter);
	}

	return filters.length > 0 ? and(...filters) : undefined;
};

export const getMediaAssetSort = (
	sortBy: ListMediaAssetsQuery["sortBy"] = "createdAt",
	sortDirection: ListMediaAssetsQuery["sortDirection"] = "desc",
	usageCount: SQL<number>,
) => {
	const columns: Record<NonNullable<ListMediaAssetsQuery["sortBy"]>, SQLWrapper> = {
		createdAt: mediaAsset.createdAt,
		sizeBytes: mediaAsset.sizeBytes,
		kind: mediaAsset.kind,
		provider: mediaAsset.provider,
		mimeType: mediaAsset.mimeType,
		usageCount,
	};
	const column = columns[sortBy];

	return sortDirection === "asc" ? asc(column) : desc(column);
};

export const toMediaAssetUsageSummary = (counts: UsageCountInput) => {
	const courseThumbnailCount = Number(counts.courseThumbnailCount ?? 0);
	const lessonVideoCount = Number(counts.lessonVideoCount ?? 0);
	const certificatePdfCount = Number(counts.certificatePdfCount ?? 0);

	return {
		courseThumbnailCount,
		lessonVideoCount,
		certificatePdfCount,
		totalCount: courseThumbnailCount + lessonVideoCount + certificatePdfCount,
	};
};
