import { eq } from "drizzle-orm";
import { db } from "../../../db/db.js";
import {
	certificate,
	course,
	enrollment,
	mediaAsset,
	user,
} from "../../../db/schemas/schema.js";

export const verifySharedCertificateService = async (
	certificateCode: string,
) => {
	const [certificateRow] = await db
		.select({
			id: certificate.id,
			certificateCode: certificate.certificateCode,
			issuedAt: certificate.issuedAt,
			createdAt: certificate.createdAt,
			student: {
				id: user.id,
				name: user.name,
				image: user.image,
			},
			course: {
				id: course.id,
				title: course.title,
				slug: course.slug,
				status: course.status,
			},
			enrollment: {
				status: enrollment.status,
				completedAt: enrollment.completedAt,
			},
			pdfAsset: {
				id: mediaAsset.id,
				url: mediaAsset.url,
				mimeType: mediaAsset.mimeType,
			},
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
		certificate: {
			id: certificateRow.id,
			certificateCode: certificateRow.certificateCode,
			issuedAt: certificateRow.issuedAt,
			createdAt: certificateRow.createdAt,
			student: certificateRow.student,
			course: certificateRow.course,
			enrollment: certificateRow.enrollment,
			pdfAsset: certificateRow.pdfAsset?.id
				? {
						id: certificateRow.pdfAsset.id,
						url: certificateRow.pdfAsset.url,
						mimeType: certificateRow.pdfAsset.mimeType,
					}
				: null,
		},
	};
};
