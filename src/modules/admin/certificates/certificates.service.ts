import { count, desc, eq } from "drizzle-orm";
import { db } from "../../../db/db.js";
import {
	certificate,
	course,
	enrollment,
	mediaAsset,
	user,
} from "../../../db/schemas/schema.js";
import { notFoundError } from "../../../shared/constants/errors.js";
import type { ListCertificatesQuery } from "./certificates.validation.js";
import {
	certificateRelations,
	getCertificateFilterValues,
	getCertificateFilters,
	getCertificatePagination,
	getCertificatePaginationMeta,
	getCertificateSort,
	normalizeCertificateRow,
} from "./certificates.utils.js";

export const listCertificatesService = async (
	query: ListCertificatesQuery,
) => {
	const { limit, offset } = getCertificatePagination(query);
	const where = getCertificateFilters(query);

	const [totalRow] = await db
		.select({ value: count() })
		.from(certificate)
		.innerJoin(user, eq(certificate.userId, user.id))
		.innerJoin(course, eq(certificate.courseId, course.id))
		.innerJoin(enrollment, eq(certificate.enrollmentId, enrollment.id))
		.leftJoin(mediaAsset, eq(certificate.pdfAssetId, mediaAsset.id))
		.where(where);

	const certificateRows = await db
		.select({
			id: certificate.id,
			certificateCode: certificate.certificateCode,
			issuedAt: certificate.issuedAt,
			createdAt: certificate.createdAt,
			...certificateRelations,
		})
		.from(certificate)
		.innerJoin(user, eq(certificate.userId, user.id))
		.innerJoin(course, eq(certificate.courseId, course.id))
		.innerJoin(enrollment, eq(certificate.enrollmentId, enrollment.id))
		.leftJoin(mediaAsset, eq(certificate.pdfAssetId, mediaAsset.id))
		.where(where)
		.orderBy(
			getCertificateSort(query.sortBy, query.sortDirection),
			desc(certificate.id),
		)
		.limit(limit)
		.offset(offset);

	const items = certificateRows.map(normalizeCertificateRow);

	return {
		filters: {
			...getCertificateFilterValues(query),
			limit,
			offset,
			sortBy: query.sortBy ?? "issuedAt",
			sortDirection: query.sortDirection ?? "desc",
		},
		items,
		pagination: getCertificatePaginationMeta({
			total: totalRow.value,
			limit,
			offset,
			itemCount: items.length,
		}),
	};
};

export const verifyCertificateService = async (certificateCode: string) => {
	const [certificateRow] = await db
		.select({
			id: certificate.id,
			certificateCode: certificate.certificateCode,
			issuedAt: certificate.issuedAt,
			createdAt: certificate.createdAt,
			...certificateRelations,
		})
		.from(certificate)
		.innerJoin(user, eq(certificate.userId, user.id))
		.innerJoin(course, eq(certificate.courseId, course.id))
		.innerJoin(enrollment, eq(certificate.enrollmentId, enrollment.id))
		.leftJoin(mediaAsset, eq(certificate.pdfAssetId, mediaAsset.id))
		.where(eq(certificate.certificateCode, certificateCode));

	if (!certificateRow) {
		return {
			valid: false,
			certificate: null,
		};
	}

	return {
		valid: true,
		certificate: normalizeCertificateRow(certificateRow),
	};
};

export const getCertificateDetailsService = async (
	certificateId: string,
) => {
	const [certificateRow] = await db
		.select({
			id: certificate.id,
			certificateCode: certificate.certificateCode,
			issuedAt: certificate.issuedAt,
			createdAt: certificate.createdAt,
			...certificateRelations,
		})
		.from(certificate)
		.innerJoin(user, eq(certificate.userId, user.id))
		.innerJoin(course, eq(certificate.courseId, course.id))
		.innerJoin(enrollment, eq(certificate.enrollmentId, enrollment.id))
		.leftJoin(mediaAsset, eq(certificate.pdfAssetId, mediaAsset.id))
		.where(eq(certificate.id, certificateId));

	if (!certificateRow) {
		throw notFoundError("Certificate not found");
	}

	return normalizeCertificateRow(certificateRow);
};
