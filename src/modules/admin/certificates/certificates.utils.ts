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
	type SQLWrapper,
} from "drizzle-orm";
import {
	certificate,
	course,
	enrollment,
	mediaAsset,
	user,
} from "../../../db/schemas/schema.js";
import type { ListCertificatesQuery } from "./certificates.validation.js";

type CertificateRow = {
	id: string;
	certificateCode: string;
	issuedAt: Date;
	createdAt: Date;
	student: {
		id: string;
		name: string;
		email: string;
		image: string | null;
	};
	course: {
		id: string;
		title: string;
		slug: string;
		status: string;
	};
	enrollment: {
		id: string;
		status: string;
		enrolledAt: Date;
		completedAt: Date | null;
	};
	pdfAsset: {
		id: string | null;
		url: string | null;
		mimeType: string | null;
		sizeBytes: number | null;
		kind: string | null;
	} | null;
};

export const validationError = (
	result: { success: false; error: unknown },
	c: Context,
) => {
	return c.json({ success: false, errors: result.error }, 400);
};

export const getCertificatePagination = (query: ListCertificatesQuery) => {
	return {
		limit: query.limit ? Number(query.limit) : 20,
		offset: query.offset ? Number(query.offset) : 0,
	};
};

export const getCertificatePaginationMeta = ({
	total,
	limit,
	offset,
	itemCount,
}: {
	total: number;
	limit: number;
	offset: number;
	itemCount: number;
}) => {
	return {
		limit,
		offset,
		count: itemCount,
		total,
		hasNext: offset + itemCount < total,
		hasPrev: offset > 0,
	};
};

export const getCertificateDateRange = (
	query: Pick<ListCertificatesQuery, "from" | "to">,
) => {
	return {
		from: query.from ? new Date(`${query.from}T00:00:00.000Z`) : undefined,
		to: query.to ? new Date(`${query.to}T23:59:59.999Z`) : undefined,
	};
};

export const getCertificateFilters = (query: ListCertificatesQuery) => {
	const filters: SQLWrapper[] = [];
	const { from, to } = getCertificateDateRange(query);

	if (query.search) {
		const search = `%${query.search}%`;
		const searchFilter = or(
			ilike(certificate.certificateCode, search),
			ilike(user.name, search),
			ilike(user.email, search),
			ilike(course.title, search),
			ilike(course.slug, search),
		);

		if (searchFilter) filters.push(searchFilter);
	}

	if (query.courseId) filters.push(eq(certificate.courseId, query.courseId));
	if (query.userId) filters.push(eq(certificate.userId, query.userId));
	if (from) filters.push(gte(certificate.issuedAt, from));
	if (to) filters.push(lte(certificate.issuedAt, to));

	if (query.hasPdf === "true") {
		filters.push(sql`${certificate.pdfAssetId} is not null`);
	}

	if (query.hasPdf === "false") {
		filters.push(sql`${certificate.pdfAssetId} is null`);
	}

	return filters.length > 0 ? and(...filters) : undefined;
};

export const getCertificateFilterValues = (query: ListCertificatesQuery) => {
	return {
		search: query.search ?? null,
		courseId: query.courseId ?? null,
		userId: query.userId ?? null,
		from: query.from ?? null,
		to: query.to ?? null,
		hasPdf: query.hasPdf ? query.hasPdf === "true" : null,
	};
};

export const getCertificateSort = (
	sortBy: ListCertificatesQuery["sortBy"] = "issuedAt",
	sortDirection: ListCertificatesQuery["sortDirection"] = "desc",
) => {
	const columns: Record<NonNullable<ListCertificatesQuery["sortBy"]>, SQLWrapper> = {
		issuedAt: certificate.issuedAt,
		createdAt: certificate.createdAt,
		certificateCode: certificate.certificateCode,
		studentName: user.name,
		courseTitle: course.title,
	};

	const column = columns[sortBy];

	return sortDirection === "asc" ? asc(column) : desc(column);
};

export const normalizeCertificateRow = (row: CertificateRow) => {
	return {
		id: row.id,
		certificateCode: row.certificateCode,
		issuedAt: row.issuedAt,
		createdAt: row.createdAt,
		student: row.student,
		course: row.course,
		enrollment: row.enrollment,
		pdfAsset: row.pdfAsset?.id
			? {
					id: row.pdfAsset.id,
					url: row.pdfAsset.url,
					mimeType: row.pdfAsset.mimeType,
					sizeBytes: row.pdfAsset.sizeBytes,
					kind: row.pdfAsset.kind,
				}
			: null,
	};
};

export const certificateRelations = {
	student: {
		id: user.id,
		name: user.name,
		email: user.email,
		image: user.image,
	},
	course: {
		id: course.id,
		title: course.title,
		slug: course.slug,
		status: course.status,
	},
	enrollment: {
		id: enrollment.id,
		status: enrollment.status,
		enrolledAt: enrollment.enrolledAt,
		completedAt: enrollment.completedAt,
	},
	pdfAsset: {
		id: mediaAsset.id,
		url: mediaAsset.url,
		mimeType: mediaAsset.mimeType,
		sizeBytes: mediaAsset.sizeBytes,
		kind: mediaAsset.kind,
	},
};
