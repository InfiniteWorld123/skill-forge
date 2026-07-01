import {
	and,
	count,
	countDistinct,
	desc,
	eq,
	gte,
	ilike,
	lte,
	or,
	sql,
	type SQLWrapper,
} from "drizzle-orm";
import { db } from "../../../db/db.js";
import {
	certificate,
	course,
	courseReview,
	enrollment,
	lessonQuestion,
	purchaseOrder,
	studentProfile,
	teacherProfile,
	user,
} from "../../../db/schemas/schema.js";
import { notFoundError } from "../../../shared/constants/errors.js";
import type {
	GetUserActivityQuery,
	ListUsersQuery,
} from "./users.validation.js";
import {
	getActivityLimit,
	getDateRangeValues,
	getListUsersSort,
	getPagination,
	getPaginations,
	normalizeCertificateActivity,
	normalizeEnrollmentActivity,
	normalizeOrderActivity,
	normalizeQuestionActivity,
	normalizeReviewActivity,
	sortAndLimitActivity,
} from "./users.utils.js";

const getListUsersFilters = (query: ListUsersQuery) => {
	const filters: SQLWrapper[] = [];

	if (query.search) {
		const search = `%${query.search}%`;
		const searchFilter = or(ilike(user.name, search), ilike(user.email, search));

		if (searchFilter) filters.push(searchFilter);
	}

	if (query.role) {
		filters.push(eq(user.role, query.role));
	}

	if (query.banned) {
		filters.push(
			query.banned === "true"
				? eq(user.banned, true)
				: sql<boolean>`coalesce(${user.banned}, false) = false`,
		);
	}

	const { from, to } = getDateRangeValues(query);

	if (from) {
		filters.push(gte(user.createdAt, from));
	}

	if (to) {
		filters.push(lte(user.createdAt, to));
	}

	return filters.length > 0 ? and(...filters) : undefined;
};

const selectUserAccountById = async (userId: string) => {
	const [account] = await db
		.select({
			id: user.id,
			name: user.name,
			email: user.email,
			image: user.image,
			role: user.role,
			banned: user.banned,
			banReason: user.banReason,
			banExpires: user.banExpires,
			emailVerified: user.emailVerified,
			createdAt: user.createdAt,
			updatedAt: user.updatedAt,
		})
		.from(user)
		.where(eq(user.id, userId));

	if (!account) {
		throw notFoundError("User not found");
	}

	return account;
};

export const listUsersService = async (query: ListUsersQuery) => {
	const { limit, offset } = getPagination(query);
	const where = getListUsersFilters(query);
	const enrollmentCount = countDistinct(enrollment.id);
	const orderCount = countDistinct(purchaseOrder.id);

	const [totalRow] = await db.select({ value: count() }).from(user).where(where);

	const items = await db
		.select({
			user: {
				id: user.id,
				name: user.name,
				email: user.email,
				image: user.image,
				role: user.role,
				banned: sql<boolean>`coalesce(${user.banned}, false)`,
				emailVerified: user.emailVerified,
				createdAt: user.createdAt,
				updatedAt: user.updatedAt,
			},
			profileFlags: {
				hasStudentProfile: sql<boolean>`${studentProfile.id} is not null`,
				studentProfileIsPublic: sql<boolean>`coalesce(${studentProfile.isPublic}, false)`,
				hasTeacherProfile: sql<boolean>`${teacherProfile.id} is not null`,
				teacherProfileIsPublic: sql<boolean>`coalesce(${teacherProfile.isPublic}, false)`,
			},
			counts: {
				enrollmentCount,
				orderCount,
			},
		})
		.from(user)
		.leftJoin(studentProfile, eq(studentProfile.userId, user.id))
		.leftJoin(teacherProfile, eq(teacherProfile.userId, user.id))
		.leftJoin(enrollment, eq(enrollment.userId, user.id))
		.leftJoin(purchaseOrder, eq(purchaseOrder.userId, user.id))
		.where(where)
		.groupBy(
			user.id,
			user.name,
			user.email,
			user.image,
			user.role,
			user.banned,
			user.emailVerified,
			user.createdAt,
			user.updatedAt,
			studentProfile.id,
			studentProfile.isPublic,
			teacherProfile.id,
			teacherProfile.isPublic,
		)
		.orderBy(
			getListUsersSort(
				query.sortBy,
				query.sortDirection,
				enrollmentCount,
				orderCount,
			),
		)
		.limit(limit)
		.offset(offset);

	return {
		items,
		paginations: getPaginations({
			total: totalRow.value,
			limit,
			offset,
			itemCount: items.length,
		}),
	};
};

export const getUserDetailsService = async (userId: string) => {
	const account = await selectUserAccountById(userId);

	const [studentProfileRecord] = await db
		.select()
		.from(studentProfile)
		.where(eq(studentProfile.userId, userId));

	const [teacherProfileRecord] = await db
		.select()
		.from(teacherProfile)
		.where(eq(teacherProfile.userId, userId));

	const orders = await db
		.select({
			id: purchaseOrder.id,
			status: purchaseOrder.status,
			subtotalCents: purchaseOrder.subtotalCents,
			totalCents: purchaseOrder.totalCents,
			currency: purchaseOrder.currency,
			createdAt: purchaseOrder.createdAt,
			updatedAt: purchaseOrder.updatedAt,
			paidAt: purchaseOrder.paidAt,
			refundedAt: purchaseOrder.refundedAt,
		})
		.from(purchaseOrder)
		.where(eq(purchaseOrder.userId, userId))
		.orderBy(desc(purchaseOrder.createdAt));

	const enrollments = await db
		.select({
			id: enrollment.id,
			status: enrollment.status,
			enrolledAt: enrollment.enrolledAt,
			completedAt: enrollment.completedAt,
			updatedAt: enrollment.updatedAt,
			course: {
				id: course.id,
				title: course.title,
				slug: course.slug,
				status: course.status,
			},
		})
		.from(enrollment)
		.innerJoin(course, eq(course.id, enrollment.courseId))
		.where(eq(enrollment.userId, userId))
		.orderBy(desc(enrollment.enrolledAt));

	const reviews = await db
		.select({
			id: courseReview.id,
			rating: courseReview.rating,
			title: courseReview.title,
			body: courseReview.body,
			createdAt: courseReview.createdAt,
			updatedAt: courseReview.updatedAt,
			course: {
				id: course.id,
				title: course.title,
				slug: course.slug,
				status: course.status,
			},
		})
		.from(courseReview)
		.innerJoin(course, eq(course.id, courseReview.courseId))
		.where(eq(courseReview.userId, userId))
		.orderBy(desc(courseReview.createdAt));

	const certificates = await db
		.select({
			id: certificate.id,
			enrollmentId: certificate.enrollmentId,
			certificateCode: certificate.certificateCode,
			issuedAt: certificate.issuedAt,
			createdAt: certificate.createdAt,
			course: {
				id: course.id,
				title: course.title,
				slug: course.slug,
				status: course.status,
			},
		})
		.from(certificate)
		.innerJoin(course, eq(course.id, certificate.courseId))
		.where(eq(certificate.userId, userId))
		.orderBy(desc(certificate.issuedAt));

	return {
		account,
		studentProfile: studentProfileRecord ?? null,
		teacherProfile: teacherProfileRecord ?? null,
		orders,
		enrollments,
		reviews,
		certificates,
		summary: {
			orderCount: orders.length,
			enrollmentCount: enrollments.length,
			reviewCount: reviews.length,
			certificateCount: certificates.length,
		},
	};
};

export const getUserActivityService = async (
	userId: string,
	query: GetUserActivityQuery,
) => {
	const account = await selectUserAccountById(userId);
	const limit = getActivityLimit(query);

	const orders = await db
		.select({
			id: purchaseOrder.id,
			status: purchaseOrder.status,
			totalCents: purchaseOrder.totalCents,
			currency: purchaseOrder.currency,
			createdAt: purchaseOrder.createdAt,
			paidAt: purchaseOrder.paidAt,
			refundedAt: purchaseOrder.refundedAt,
		})
		.from(purchaseOrder)
		.where(eq(purchaseOrder.userId, userId))
		.orderBy(desc(purchaseOrder.createdAt))
		.limit(limit);

	const userEnrollments = await db
		.select({
			id: enrollment.id,
			status: enrollment.status,
			enrolledAt: enrollment.enrolledAt,
			completedAt: enrollment.completedAt,
			course: {
				id: course.id,
				title: course.title,
				slug: course.slug,
				status: course.status,
			},
		})
		.from(enrollment)
		.innerJoin(course, eq(course.id, enrollment.courseId))
		.where(eq(enrollment.userId, userId))
		.orderBy(desc(enrollment.enrolledAt))
		.limit(limit);

	const reviews = await db
		.select({
			id: courseReview.id,
			rating: courseReview.rating,
			title: courseReview.title,
			body: courseReview.body,
			createdAt: courseReview.createdAt,
			course: {
				id: course.id,
				title: course.title,
				slug: course.slug,
				status: course.status,
			},
		})
		.from(courseReview)
		.innerJoin(course, eq(course.id, courseReview.courseId))
		.where(eq(courseReview.userId, userId))
		.orderBy(desc(courseReview.createdAt))
		.limit(limit);

	const questions = await db
		.select({
			id: lessonQuestion.id,
			lessonId: lessonQuestion.lessonId,
			status: lessonQuestion.status,
			title: lessonQuestion.title,
			body: lessonQuestion.body,
			createdAt: lessonQuestion.createdAt,
			updatedAt: lessonQuestion.updatedAt,
		})
		.from(lessonQuestion)
		.where(eq(lessonQuestion.userId, userId))
		.orderBy(desc(lessonQuestion.createdAt))
		.limit(limit);

	const certificates = await db
		.select({
			id: certificate.id,
			enrollmentId: certificate.enrollmentId,
			certificateCode: certificate.certificateCode,
			issuedAt: certificate.issuedAt,
			course: {
				id: course.id,
				title: course.title,
				slug: course.slug,
				status: course.status,
			},
		})
		.from(certificate)
		.innerJoin(course, eq(course.id, certificate.courseId))
		.where(eq(certificate.userId, userId))
		.orderBy(desc(certificate.issuedAt))
		.limit(limit);

	return {
		user: {
			id: account.id,
			name: account.name,
			email: account.email,
		},
		items: sortAndLimitActivity(
			[
				...orders.map(normalizeOrderActivity),
				...userEnrollments.map(normalizeEnrollmentActivity),
				...reviews.map(normalizeReviewActivity),
				...questions.map(normalizeQuestionActivity),
				...certificates.map(normalizeCertificateActivity),
			],
			limit,
		),
		limit,
	};
};
