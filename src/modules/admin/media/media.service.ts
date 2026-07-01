import { count, desc, eq, sql } from "drizzle-orm";
import { db } from "../../../db/db.js";
import {
	certificate,
	course,
	lesson,
	mediaAsset,
	user,
} from "../../../db/schemas/schema.js";
import { notFoundError } from "../../../shared/constants/errors.js";
import type { ListMediaAssetsQuery } from "./media.validation.js";
import {
	getMediaAssetDateRange,
	getMediaAssetFilters,
	getMediaAssetPagination,
	getMediaAssetPaginationMeta,
	getMediaAssetSort,
	getMediaAssetUsageCountSql,
	toMediaAssetUsageSummary,
} from "./media.utils.js";

export const listMediaAssetsService = async (query: ListMediaAssetsQuery) => {
	const dateRange = getMediaAssetDateRange(query);
	const { page, limit, offset } = getMediaAssetPagination(query);
	const where = getMediaAssetFilters(query, dateRange);
	const usageCount = getMediaAssetUsageCountSql();
	const courseThumbnailCount = sql<number>`(
		select count(*)::int
		from ${course}
		where ${course.thumbnailAssetId} = ${mediaAsset.id}
	)`;
	const lessonVideoCount = sql<number>`(
		select count(*)::int
		from ${lesson}
		where ${lesson.videoAssetId} = ${mediaAsset.id}
	)`;
	const certificatePdfCount = sql<number>`(
		select count(*)::int
		from ${certificate}
		where ${certificate.pdfAssetId} = ${mediaAsset.id}
	)`;

	const [totalRow] = await db
		.select({ value: count() })
		.from(mediaAsset)
		.leftJoin(user, eq(mediaAsset.ownerId, user.id))
		.where(where);

	const rows = await db
		.select({
			id: mediaAsset.id,
			kind: mediaAsset.kind,
			provider: mediaAsset.provider,
			providerKey: mediaAsset.providerKey,
			url: mediaAsset.url,
			mimeType: mediaAsset.mimeType,
			sizeBytes: mediaAsset.sizeBytes,
			createdAt: mediaAsset.createdAt,
			ownerId: user.id,
			ownerName: user.name,
			ownerEmail: user.email,
			ownerImage: user.image,
			ownerRole: user.role,
			courseThumbnailCount,
			lessonVideoCount,
			certificatePdfCount,
			usageCount,
		})
		.from(mediaAsset)
		.leftJoin(user, eq(mediaAsset.ownerId, user.id))
		.where(where)
		.orderBy(
			getMediaAssetSort(query.sortBy, query.sortDirection, usageCount),
			desc(mediaAsset.id),
		)
		.limit(limit)
		.offset(offset);

	return {
		filters: {
			kind: query.kind ?? null,
			provider: query.provider ?? null,
			ownerId: query.ownerId ?? null,
			search: query.search ?? null,
			from: dateRange.from?.toISOString() ?? null,
			to: dateRange.to?.toISOString() ?? null,
			sortBy: query.sortBy ?? "createdAt",
			sortDirection: query.sortDirection ?? "desc",
		},
		pagination: getMediaAssetPaginationMeta({
			page,
			limit,
			total: totalRow.value,
		}),
		items: rows.map((row) => ({
			id: row.id,
			kind: row.kind,
			provider: row.provider,
			providerKey: row.providerKey,
			url: row.url,
			mimeType: row.mimeType,
			sizeBytes: row.sizeBytes,
			createdAt: row.createdAt,
			owner: row.ownerId
				? {
						id: row.ownerId,
						name: row.ownerName,
						email: row.ownerEmail,
						image: row.ownerImage,
						role: row.ownerRole,
					}
				: null,
			usage: toMediaAssetUsageSummary({
				courseThumbnailCount: row.courseThumbnailCount,
				lessonVideoCount: row.lessonVideoCount,
				certificatePdfCount: row.certificatePdfCount,
			}),
		})),
	};
};

export const getMediaAssetDetailsService = async (assetId: string) => {
	const [asset] = await db
		.select({
			id: mediaAsset.id,
			kind: mediaAsset.kind,
			provider: mediaAsset.provider,
			providerKey: mediaAsset.providerKey,
			url: mediaAsset.url,
			mimeType: mediaAsset.mimeType,
			sizeBytes: mediaAsset.sizeBytes,
			createdAt: mediaAsset.createdAt,
			ownerId: user.id,
			ownerName: user.name,
			ownerEmail: user.email,
			ownerImage: user.image,
			ownerRole: user.role,
		})
		.from(mediaAsset)
		.leftJoin(user, eq(mediaAsset.ownerId, user.id))
		.where(eq(mediaAsset.id, assetId));

	if (!asset) {
		throw notFoundError("Media asset not found");
	}

	const [courses, lessons, certificates] = await Promise.all([
		db
			.select({
				id: course.id,
				title: course.title,
				slug: course.slug,
				status: course.status,
				createdAt: course.createdAt,
				publishedAt: course.publishedAt,
			})
			.from(course)
			.where(eq(course.thumbnailAssetId, asset.id))
			.orderBy(desc(course.createdAt), desc(course.id)),
		db
			.select({
				id: lesson.id,
				title: lesson.title,
				type: lesson.type,
				description: lesson.description,
				durationSeconds: lesson.durationSeconds,
				position: lesson.position,
				isPreview: lesson.isPreview,
				createdAt: lesson.createdAt,
			})
			.from(lesson)
			.where(eq(lesson.videoAssetId, asset.id))
			.orderBy(desc(lesson.createdAt), desc(lesson.id)),
		db
			.select({
				id: certificate.id,
				certificateCode: certificate.certificateCode,
				issuedAt: certificate.issuedAt,
				createdAt: certificate.createdAt,
				userId: user.id,
				userName: user.name,
				userEmail: user.email,
				courseId: course.id,
				courseTitle: course.title,
				courseSlug: course.slug,
			})
			.from(certificate)
			.innerJoin(user, eq(certificate.userId, user.id))
			.innerJoin(course, eq(certificate.courseId, course.id))
			.where(eq(certificate.pdfAssetId, asset.id))
			.orderBy(desc(certificate.issuedAt), desc(certificate.id)),
	]);

	const usageSummary = toMediaAssetUsageSummary({
		courseThumbnailCount: courses.length,
		lessonVideoCount: lessons.length,
		certificatePdfCount: certificates.length,
	});

	return {
		asset: {
			id: asset.id,
			kind: asset.kind,
			provider: asset.provider,
			providerKey: asset.providerKey,
			url: asset.url,
			mimeType: asset.mimeType,
			sizeBytes: asset.sizeBytes,
			createdAt: asset.createdAt,
		},
		owner: asset.ownerId
			? {
					id: asset.ownerId,
					name: asset.ownerName,
					email: asset.ownerEmail,
					image: asset.ownerImage,
					role: asset.ownerRole,
				}
			: null,
		usage: {
			summary: usageSummary,
			courses: courses.map((row) => ({
				id: row.id,
				title: row.title,
				slug: row.slug,
				status: row.status,
				createdAt: row.createdAt,
				publishedAt: row.publishedAt,
				usageType: "course_thumbnail" as const,
			})),
			lessons: lessons.map((row) => ({
				id: row.id,
				title: row.title,
				type: row.type,
				description: row.description,
				durationSeconds: row.durationSeconds,
				position: row.position,
				isPreview: row.isPreview,
				createdAt: row.createdAt,
				usageType: "lesson_video" as const,
			})),
			certificates: certificates.map((row) => ({
				id: row.id,
				certificateCode: row.certificateCode,
				issuedAt: row.issuedAt,
				createdAt: row.createdAt,
				user: {
					id: row.userId,
					name: row.userName,
					email: row.userEmail,
				},
				course: {
					id: row.courseId,
					title: row.courseTitle,
					slug: row.courseSlug,
				},
				usageType: "certificate_pdf" as const,
			})),
		},
	};
};
