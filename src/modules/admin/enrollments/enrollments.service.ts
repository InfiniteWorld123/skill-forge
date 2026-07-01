import { and, count, desc, eq } from "drizzle-orm";
import { db } from "../../../db/db.js";
import {
	certificate,
	course,
	courseReview,
	courseSection,
	enrollment,
	lesson,
	lessonProgress,
	purchaseOrderItem,
	user,
} from "../../../db/schemas/schema.js";
import { notFoundError } from "../../../shared/constants/errors.js";
import {
	buildProgressDetails,
	getCompletedAtForStatusUpdate,
	getEnrollmentFilters,
	getEnrollmentSort,
	getPagination,
	getPaginationMeta,
	getProgressPercent,
} from "./enrollments.utils.js";
import type {
	ListEnrollmentsQuery,
	UpdateEnrollmentStatusInput,
} from "./enrollments.validation.js";

const selectEnrollmentSummaryById = async (enrollmentId: string) => {
	const totalLessonCount = count(lesson.id);
	const completedLessonCount = count(lessonProgress.id);
	const certificateCount = count(certificate.id);
	const reviewCount = count(courseReview.id);

	const [row] = await db
		.select({
			id: enrollment.id,
			status: enrollment.status,
			enrolledAt: enrollment.enrolledAt,
			completedAt: enrollment.completedAt,
			updatedAt: enrollment.updatedAt,
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
			orderItem: {
				id: purchaseOrderItem.id,
				orderId: purchaseOrderItem.orderId,
				titleSnapshot: purchaseOrderItem.titleSnapshot,
				priceCents: purchaseOrderItem.priceCents,
				currency: purchaseOrderItem.currency,
			},
			totalLessons: totalLessonCount,
			completedLessons: completedLessonCount,
			certificateCount,
			reviewCount,
		})
		.from(enrollment)
		.innerJoin(user, eq(enrollment.userId, user.id))
		.innerJoin(course, eq(enrollment.courseId, course.id))
		.leftJoin(purchaseOrderItem, eq(enrollment.orderItemId, purchaseOrderItem.id))
		.leftJoin(courseSection, eq(courseSection.courseId, course.id))
		.leftJoin(lesson, eq(lesson.sectionId, courseSection.id))
		.leftJoin(
			lessonProgress,
			and(
				eq(lessonProgress.enrollmentId, enrollment.id),
				eq(lessonProgress.lessonId, lesson.id),
			),
		)
		.leftJoin(certificate, eq(certificate.enrollmentId, enrollment.id))
		.leftJoin(courseReview, eq(courseReview.enrollmentId, enrollment.id))
		.where(eq(enrollment.id, enrollmentId))
		.groupBy(
			enrollment.id,
			enrollment.status,
			enrollment.enrolledAt,
			enrollment.completedAt,
			enrollment.updatedAt,
			user.id,
			user.name,
			user.email,
			user.image,
			course.id,
			course.title,
			course.slug,
			course.status,
			purchaseOrderItem.id,
			purchaseOrderItem.orderId,
			purchaseOrderItem.titleSnapshot,
			purchaseOrderItem.priceCents,
			purchaseOrderItem.currency,
		);

	if (!row) return undefined;

	return {
		id: row.id,
		status: row.status,
		enrolledAt: row.enrolledAt,
		completedAt: row.completedAt,
		updatedAt: row.updatedAt,
		student: row.student,
		course: row.course,
		orderItem: row.orderItem?.id ? row.orderItem : null,
		progress: {
			totalLessons: row.totalLessons,
			completedLessons: row.completedLessons,
			percent: getProgressPercent(row.completedLessons, row.totalLessons),
		},
		hasCertificate: row.certificateCount > 0,
		hasReview: row.reviewCount > 0,
	};
};

export const listEnrollmentsService = async (
	query: ListEnrollmentsQuery,
) => {
	const { limit, offset } = getPagination(query);
	const where = getEnrollmentFilters(query);
	const totalLessonCount = count(lesson.id);
	const completedLessonCount = count(lessonProgress.id);
	const certificateCount = count(certificate.id);
	const reviewCount = count(courseReview.id);

	const [totalRow] = await db
		.select({ value: count() })
		.from(enrollment)
		.innerJoin(user, eq(enrollment.userId, user.id))
		.innerJoin(course, eq(enrollment.courseId, course.id))
		.leftJoin(purchaseOrderItem, eq(enrollment.orderItemId, purchaseOrderItem.id))
		.where(where);

	const rows = await db
		.select({
			id: enrollment.id,
			status: enrollment.status,
			enrolledAt: enrollment.enrolledAt,
			completedAt: enrollment.completedAt,
			updatedAt: enrollment.updatedAt,
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
			orderItem: {
				id: purchaseOrderItem.id,
				orderId: purchaseOrderItem.orderId,
				titleSnapshot: purchaseOrderItem.titleSnapshot,
				priceCents: purchaseOrderItem.priceCents,
				currency: purchaseOrderItem.currency,
			},
			totalLessons: totalLessonCount,
			completedLessons: completedLessonCount,
			certificateCount,
			reviewCount,
		})
		.from(enrollment)
		.innerJoin(user, eq(enrollment.userId, user.id))
		.innerJoin(course, eq(enrollment.courseId, course.id))
		.leftJoin(purchaseOrderItem, eq(enrollment.orderItemId, purchaseOrderItem.id))
		.leftJoin(courseSection, eq(courseSection.courseId, course.id))
		.leftJoin(lesson, eq(lesson.sectionId, courseSection.id))
		.leftJoin(
			lessonProgress,
			and(
				eq(lessonProgress.enrollmentId, enrollment.id),
				eq(lessonProgress.lessonId, lesson.id),
			),
		)
		.leftJoin(certificate, eq(certificate.enrollmentId, enrollment.id))
		.leftJoin(courseReview, eq(courseReview.enrollmentId, enrollment.id))
		.where(where)
		.groupBy(
			enrollment.id,
			enrollment.status,
			enrollment.enrolledAt,
			enrollment.completedAt,
			enrollment.updatedAt,
			user.id,
			user.name,
			user.email,
			user.image,
			course.id,
			course.title,
			course.slug,
			course.status,
			purchaseOrderItem.id,
			purchaseOrderItem.orderId,
			purchaseOrderItem.titleSnapshot,
			purchaseOrderItem.priceCents,
			purchaseOrderItem.currency,
		)
		.orderBy(
			getEnrollmentSort(query.sortBy, query.sortDirection),
			desc(enrollment.id),
		)
		.limit(limit)
		.offset(offset);

	const items = rows.map((row) => ({
		id: row.id,
		status: row.status,
		enrolledAt: row.enrolledAt,
		completedAt: row.completedAt,
		updatedAt: row.updatedAt,
		student: row.student,
		course: row.course,
		orderItem: row.orderItem?.id ? row.orderItem : null,
		progress: {
			totalLessons: row.totalLessons,
			completedLessons: row.completedLessons,
			percent: getProgressPercent(row.completedLessons, row.totalLessons),
		},
		hasCertificate: row.certificateCount > 0,
		hasReview: row.reviewCount > 0,
	}));

	return {
		items,
		pagination: getPaginationMeta({
			total: totalRow.value,
			limit,
			offset,
			itemCount: items.length,
		}),
		filters: {
			search: query.search,
			status: query.status,
			courseId: query.courseId,
			userId: query.userId,
			from: query.from,
			to: query.to,
			sortBy: query.sortBy ?? "enrolledAt",
			sortDirection: query.sortDirection ?? "desc",
		},
	};
};

export const getEnrollmentDetailsService = async (enrollmentId: string) => {
	const [row] = await db
		.select({
			id: enrollment.id,
			status: enrollment.status,
			enrolledAt: enrollment.enrolledAt,
			completedAt: enrollment.completedAt,
			updatedAt: enrollment.updatedAt,
			student: {
				id: user.id,
				name: user.name,
				email: user.email,
				image: user.image,
				emailVerified: user.emailVerified,
				banned: user.banned,
				banReason: user.banReason,
				createdAt: user.createdAt,
			},
			course: {
				id: course.id,
				title: course.title,
				slug: course.slug,
				status: course.status,
				level: course.level,
				language: course.language,
				priceCents: course.priceCents,
				currency: course.currency,
				publishedAt: course.publishedAt,
				archivedAt: course.archivedAt,
			},
			orderItem: {
				id: purchaseOrderItem.id,
				orderId: purchaseOrderItem.orderId,
				titleSnapshot: purchaseOrderItem.titleSnapshot,
				priceCents: purchaseOrderItem.priceCents,
				currency: purchaseOrderItem.currency,
				createdAt: purchaseOrderItem.createdAt,
			},
		})
		.from(enrollment)
		.innerJoin(user, eq(enrollment.userId, user.id))
		.innerJoin(course, eq(enrollment.courseId, course.id))
		.leftJoin(purchaseOrderItem, eq(enrollment.orderItemId, purchaseOrderItem.id))
		.where(eq(enrollment.id, enrollmentId));

	if (!row) {
		throw notFoundError("Enrollment not found");
	}

	const progressRows = await db
		.select({
			sectionId: courseSection.id,
			sectionTitle: courseSection.title,
			sectionPosition: courseSection.position,
			lessonId: lesson.id,
			lessonTitle: lesson.title,
			lessonType: lesson.type,
			lessonPosition: lesson.position,
			lessonDurationSeconds: lesson.durationSeconds,
			completedAt: lessonProgress.completedAt,
		})
		.from(courseSection)
		.leftJoin(lesson, eq(lesson.sectionId, courseSection.id))
		.leftJoin(
			lessonProgress,
			and(
				eq(lessonProgress.enrollmentId, row.id),
				eq(lessonProgress.lessonId, lesson.id),
			),
		)
		.where(eq(courseSection.courseId, row.course.id))
		.orderBy(courseSection.position, lesson.position);

	const [certificateRecord] = await db
		.select({
			id: certificate.id,
			certificateCode: certificate.certificateCode,
			pdfAssetId: certificate.pdfAssetId,
			issuedAt: certificate.issuedAt,
			createdAt: certificate.createdAt,
		})
		.from(certificate)
		.where(eq(certificate.enrollmentId, row.id));

	const [reviewRecord] = await db
		.select({
			id: courseReview.id,
			rating: courseReview.rating,
			title: courseReview.title,
			body: courseReview.body,
			createdAt: courseReview.createdAt,
			updatedAt: courseReview.updatedAt,
		})
		.from(courseReview)
		.where(eq(courseReview.enrollmentId, row.id));

	return {
		id: row.id,
		status: row.status,
		enrolledAt: row.enrolledAt,
		completedAt: row.completedAt,
		updatedAt: row.updatedAt,
		student: row.student,
		course: row.course,
		orderItem: row.orderItem?.id ? row.orderItem : null,
		progress: buildProgressDetails(progressRows),
		certificate: certificateRecord ?? null,
		review: reviewRecord ?? null,
	};
};

export const updateEnrollmentStatusService = async (
	enrollmentId: string,
	input: UpdateEnrollmentStatusInput,
) => {
	const completedAt = getCompletedAtForStatusUpdate(input);

	const [updatedEnrollment] = await db
		.update(enrollment)
		.set({
			status: input.status,
			completedAt,
			updatedAt: new Date(),
		})
		.where(eq(enrollment.id, enrollmentId))
		.returning({ id: enrollment.id });

	if (!updatedEnrollment) {
		throw notFoundError("Enrollment not found");
	}

	const summary = await selectEnrollmentSummaryById(updatedEnrollment.id);

	if (!summary) {
		throw notFoundError("Enrollment not found");
	}

	return summary;
};
