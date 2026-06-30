import { and, count, countDistinct, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "../../../db/db.js";
import {
	certificate,
	course,
	courseReview,
	courseSection,
	enrollment,
	lesson,
	lessonProgress,
	payment,
	purchaseOrder,
	purchaseOrderItem,
	studentProfile,
	teacherProfile,
	user,
	wishlistItem,
} from "../../../db/schemas/schema.js";
import type {
	GetCompletionAnalyticsQueryType,
	GetCourseAnalyticsQueryType,
	GetSalesAnalyticsQueryType,
	GetUserAnalyticsQueryType,
} from "./analytics.validation.js";
import {
	getAnalyticsDateRange,
	getAnalyticsLimit,
	getUserAnalyticsDateRange,
} from "./analytics.utils.js";

export const getUserAnalyticsService = async (
	query: GetUserAnalyticsQueryType,
) => {
	const { from, to, period } = getUserAnalyticsDateRange(query);

	const userCreatedAtFilter = and(
		gte(user.createdAt, from),
		lte(user.createdAt, to),
	);

	const signupPeriod = sql.raw(`'${period}'`);
	const signupPeriodExpression = sql<string>`
		date_trunc(${signupPeriod}, ${user.createdAt})::date
	`;

	const [totalUsers] = await db.select({ value: count() }).from(user);

	const [newUsers] = await db
		.select({ value: count() })
		.from(user)
		.where(userCreatedAtFilter);

	const [bannedUsers] = await db
		.select({ value: count() })
		.from(user)
		.where(eq(user.banned, true));

	const [students] = await db.select({ value: count() }).from(studentProfile);

	const [teachers] = await db.select({ value: count() }).from(teacherProfile);

	const [activeLearners] = await db
		.select({ value: countDistinct(enrollment.userId) })
		.from(enrollment)
		.where(eq(enrollment.status, "active"));

	const signupTrend = await db
		.select({
			period: signupPeriodExpression,
			count: count(),
		})
		.from(user)
		.where(userCreatedAtFilter)
		.groupBy(signupPeriodExpression)
		.orderBy(signupPeriodExpression);

	return {
		filters: {
			from: from.toISOString(),
			to: to.toISOString(),
			period,
		},
		summary: {
			totalUsers: totalUsers.value,
			newUsers: newUsers.value,
			students: students.value,
			teachers: teachers.value,
			activeLearners: activeLearners.value,
			bannedUsers: bannedUsers.value,
		},
		charts: {
			signupTrend,
		},
	};
};

export const getCourseAnalyticsService = async (
	query: GetCourseAnalyticsQueryType,
) => {
	const { from, to, period } = getAnalyticsDateRange(query);
	const limit = getAnalyticsLimit(query);

	const courseCreatedAtFilter = and(
		gte(course.createdAt, from),
		lte(course.createdAt, to),
	);
	const enrollmentCreatedAtFilter = and(
		gte(enrollment.enrolledAt, from),
		lte(enrollment.enrolledAt, to),
	);
	const reviewCreatedAtFilter = and(
		gte(courseReview.createdAt, from),
		lte(courseReview.createdAt, to),
	);
	const wishlistCreatedAtFilter = and(
		gte(wishlistItem.createdAt, from),
		lte(wishlistItem.createdAt, to),
	);

	const analyticsPeriod = sql.raw(`'${period}'`);
	const courseCreatedAtPeriodExpression = sql<string>`
		date_trunc(${analyticsPeriod}, ${course.createdAt})::date
	`;
	const enrollmentPeriodExpression = sql<string>`
		date_trunc(${analyticsPeriod}, ${enrollment.enrolledAt})::date
	`;

	const [totalCourses] = await db.select({ value: count() }).from(course);

	const courseStatusRows = await db
		.select({
			status: course.status,
			count: count(),
		})
		.from(course)
		.groupBy(course.status);

	const courseStatusCounts = {
		draft: 0,
		published: 0,
		archived: 0,
	};

	for (const row of courseStatusRows) {
		courseStatusCounts[row.status] = row.count;
	}

	const [newCourses] = await db
		.select({ value: count() })
		.from(course)
		.where(courseCreatedAtFilter);

	const [totalEnrollments] = await db
		.select({ value: count() })
		.from(enrollment)
		.where(enrollmentCreatedAtFilter);

	const [averageRating] = await db
		.select({
			value: sql<number>`coalesce(avg(${courseReview.rating}), 0)::float8`,
		})
		.from(courseReview)
		.where(reviewCreatedAtFilter);

	const courseCreationTrend = await db
		.select({
			period: courseCreatedAtPeriodExpression,
			count: count(),
		})
		.from(course)
		.where(courseCreatedAtFilter)
		.groupBy(courseCreatedAtPeriodExpression)
		.orderBy(courseCreatedAtPeriodExpression);

	const enrollmentTrend = await db
		.select({
			period: enrollmentPeriodExpression,
			count: count(),
		})
		.from(enrollment)
		.where(enrollmentCreatedAtFilter)
		.groupBy(enrollmentPeriodExpression)
		.orderBy(enrollmentPeriodExpression);

	const enrollmentCount = count(enrollment.id);
	const topEnrolledCourses = await db
		.select({
			courseId: course.id,
			title: course.title,
			status: course.status,
			enrollments: enrollmentCount,
		})
		.from(enrollment)
		.innerJoin(course, eq(enrollment.courseId, course.id))
		.where(enrollmentCreatedAtFilter)
		.groupBy(course.id, course.title, course.status)
		.orderBy(desc(enrollmentCount))
		.limit(limit);

	const courseAverageRating = sql<number>`avg(${courseReview.rating})::float8`;
	const reviewCount = count(courseReview.id);
	const topRatedCourses = await db
		.select({
			courseId: course.id,
			title: course.title,
			status: course.status,
			averageRating: courseAverageRating,
			reviews: reviewCount,
		})
		.from(courseReview)
		.innerJoin(course, eq(courseReview.courseId, course.id))
		.where(reviewCreatedAtFilter)
		.groupBy(course.id, course.title, course.status)
		.orderBy(desc(courseAverageRating), desc(reviewCount))
		.limit(limit);

	const wishlistCount = count(wishlistItem.id);
	const mostWishlistedCourses = await db
		.select({
			courseId: course.id,
			title: course.title,
			status: course.status,
			wishlists: wishlistCount,
		})
		.from(wishlistItem)
		.innerJoin(course, eq(wishlistItem.courseId, course.id))
		.where(wishlistCreatedAtFilter)
		.groupBy(course.id, course.title, course.status)
		.orderBy(desc(wishlistCount))
		.limit(limit);

	return {
		filters: {
			from: from.toISOString(),
			to: to.toISOString(),
			period,
			limit,
		},
		summary: {
			totalCourses: totalCourses.value,
			publishedCourses: courseStatusCounts.published,
			draftCourses: courseStatusCounts.draft,
			archivedCourses: courseStatusCounts.archived,
			newCourses: newCourses.value,
			totalEnrollments: totalEnrollments.value,
			averageRating: averageRating.value,
		},
		charts: {
			courseCreationTrend,
			enrollmentTrend,
		},
		tables: {
			topEnrolledCourses,
			topRatedCourses,
			mostWishlistedCourses,
		},
	};
};

export const getSalesAnalyticsService = async (
	query: GetSalesAnalyticsQueryType,
) => {
	const { from, to, period } = getAnalyticsDateRange(query);
	const limit = getAnalyticsLimit(query);

	const orderCreatedAtFilter = and(
		gte(purchaseOrder.createdAt, from),
		lte(purchaseOrder.createdAt, to),
	);
	const paidAtFilter = and(
		gte(purchaseOrder.paidAt, from),
		lte(purchaseOrder.paidAt, to),
	);
	const paymentCreatedAtFilter = and(
		gte(payment.createdAt, from),
		lte(payment.createdAt, to),
	);

	const analyticsPeriod = sql.raw(`'${period}'`);
	const revenuePeriodExpression = sql<string>`
		date_trunc(${analyticsPeriod}, ${purchaseOrder.paidAt})::date
	`;
	const orderPeriodExpression = sql<string>`
		date_trunc(${analyticsPeriod}, ${purchaseOrder.createdAt})::date
	`;

	const orderStatusRows = await db
		.select({
			status: purchaseOrder.status,
			count: count(),
		})
		.from(purchaseOrder)
		.where(orderCreatedAtFilter)
		.groupBy(purchaseOrder.status);

	const orderStatusCounts = {
		pending: 0,
		paid: 0,
		failed: 0,
		refunded: 0,
	};

	for (const row of orderStatusRows) {
		orderStatusCounts[row.status] = row.count;
	}

	const [grossRevenue] = await db
		.select({
			value: sql<number>`coalesce(sum(${purchaseOrder.totalCents}), 0)::int`,
		})
		.from(purchaseOrder)
		.where(and(eq(purchaseOrder.status, "paid"), paidAtFilter));

	const [refundedRevenue] = await db
		.select({
			value: sql<number>`coalesce(sum(${purchaseOrder.totalCents}), 0)::int`,
		})
		.from(purchaseOrder)
		.where(and(eq(purchaseOrder.status, "refunded"), orderCreatedAtFilter));

	const [averageOrderValue] = await db
		.select({
			value: sql<number>`coalesce(avg(${purchaseOrder.totalCents}), 0)::float8`,
		})
		.from(purchaseOrder)
		.where(and(eq(purchaseOrder.status, "paid"), paidAtFilter));

	const [failedPayments] = await db
		.select({ value: count() })
		.from(payment)
		.where(and(eq(payment.status, "failed"), paymentCreatedAtFilter));

	const revenueTrend = await db
		.select({
			period: revenuePeriodExpression,
			revenueCents: sql<number>`coalesce(sum(${purchaseOrder.totalCents}), 0)::int`,
			orders: count(),
		})
		.from(purchaseOrder)
		.where(and(eq(purchaseOrder.status, "paid"), paidAtFilter))
		.groupBy(revenuePeriodExpression)
		.orderBy(revenuePeriodExpression);

	const orderTrend = await db
		.select({
			period: orderPeriodExpression,
			count: count(),
		})
		.from(purchaseOrder)
		.where(orderCreatedAtFilter)
		.groupBy(orderPeriodExpression)
		.orderBy(orderPeriodExpression);

	const courseSalesCount = count(purchaseOrderItem.id);
	const courseRevenue = sql<number>`coalesce(sum(${purchaseOrderItem.priceCents}), 0)::int`;
	const bestSellingCourses = await db
		.select({
			courseId: course.id,
			title: course.title,
			sales: courseSalesCount,
			revenueCents: courseRevenue,
		})
		.from(purchaseOrderItem)
		.innerJoin(purchaseOrder, eq(purchaseOrderItem.orderId, purchaseOrder.id))
		.innerJoin(course, eq(purchaseOrderItem.courseId, course.id))
		.where(and(eq(purchaseOrder.status, "paid"), paidAtFilter))
		.groupBy(course.id, course.title)
		.orderBy(desc(courseSalesCount), desc(courseRevenue))
		.limit(limit);

	return {
		filters: {
			from: from.toISOString(),
			to: to.toISOString(),
			period,
			limit,
		},
		summary: {
			grossRevenueCents: grossRevenue.value,
			refundedRevenueCents: refundedRevenue.value,
			paidOrders: orderStatusCounts.paid,
			pendingOrders: orderStatusCounts.pending,
			failedOrders: orderStatusCounts.failed,
			refundedOrders: orderStatusCounts.refunded,
			averageOrderValueCents: averageOrderValue.value,
			failedPayments: failedPayments.value,
		},
		charts: {
			revenueTrend,
			orderTrend,
		},
		tables: {
			bestSellingCourses,
		},
	};
};

export const getCompletionAnalyticsService = async (
	query: GetCompletionAnalyticsQueryType,
) => {
	const { from, to, period } = getAnalyticsDateRange(query);
	const limit = getAnalyticsLimit(query);

	const enrolledAtFilter = and(
		gte(enrollment.enrolledAt, from),
		lte(enrollment.enrolledAt, to),
	);
	const completedAtFilter = and(
		gte(enrollment.completedAt, from),
		lte(enrollment.completedAt, to),
	);
	const certificateCreatedAtFilter = and(
		gte(certificate.createdAt, from),
		lte(certificate.createdAt, to),
	);

	const analyticsPeriod = sql.raw(`'${period}'`);
	const enrollmentPeriodExpression = sql<string>`
		date_trunc(${analyticsPeriod}, ${enrollment.enrolledAt})::date
	`;
	const completionPeriodExpression = sql<string>`
		date_trunc(${analyticsPeriod}, ${enrollment.completedAt})::date
	`;

	const [totalEnrollments] = await db
		.select({ value: count() })
		.from(enrollment)
		.where(enrolledAtFilter);

	const [completedEnrollments] = await db
		.select({ value: count() })
		.from(enrollment)
		.where(and(sql`${enrollment.completedAt} is not null`, completedAtFilter));

	const [activeEnrollments] = await db
		.select({ value: count() })
		.from(enrollment)
		.where(and(eq(enrollment.status, "active"), enrolledAtFilter));

	const [certificatesIssued] = await db
		.select({ value: count() })
		.from(certificate)
		.where(certificateCreatedAtFilter);

	const enrollmentTrend = await db
		.select({
			period: enrollmentPeriodExpression,
			count: count(),
		})
		.from(enrollment)
		.where(enrolledAtFilter)
		.groupBy(enrollmentPeriodExpression)
		.orderBy(enrollmentPeriodExpression);

	const completionTrend = await db
		.select({
			period: completionPeriodExpression,
			count: count(),
		})
		.from(enrollment)
		.where(and(sql`${enrollment.completedAt} is not null`, completedAtFilter))
		.groupBy(completionPeriodExpression)
		.orderBy(completionPeriodExpression);

	const completedCourseEnrollments = sql<number>`
		count(*) filter (
			where ${enrollment.status} = 'completed'
			or ${enrollment.completedAt} is not null
		)::int
	`;
	const courseCompletionRate = sql<number>`
		coalesce(
			round(
				(
					count(*) filter (
						where ${enrollment.status} = 'completed'
						or ${enrollment.completedAt} is not null
					)
				) * 100.0 / nullif(count(*), 0),
				2
			),
			0
		)::float8
	`;
	const completionByCourse = await db
		.select({
			courseId: course.id,
			title: course.title,
			totalEnrollments: count(enrollment.id),
			completedEnrollments: completedCourseEnrollments,
			completionRate: courseCompletionRate,
		})
		.from(enrollment)
		.innerJoin(course, eq(enrollment.courseId, course.id))
		.where(enrolledAtFilter)
		.groupBy(course.id, course.title)
		.orderBy(desc(courseCompletionRate))
		.limit(limit);

	const lessonProgressCount = sql<number>`
		count(${lessonProgress.id}) filter (
			where ${lessonProgress.completedAt} >= ${from}
			and ${lessonProgress.completedAt} <= ${to}
		)::int
	`;
	const lessonDropoff = await db
		.select({
			courseId: course.id,
			courseTitle: course.title,
			lessonId: lesson.id,
			lessonTitle: lesson.title,
			lessonPosition: lesson.position,
			completions: lessonProgressCount,
		})
		.from(lesson)
		.innerJoin(courseSection, eq(lesson.sectionId, courseSection.id))
		.innerJoin(course, eq(courseSection.courseId, course.id))
		.leftJoin(lessonProgress, eq(lessonProgress.lessonId, lesson.id))
		.groupBy(course.id, course.title, lesson.id, lesson.title, lesson.position)
		.orderBy(lessonProgressCount)
		.limit(limit);

	const completionRate =
		totalEnrollments.value === 0
			? 0
			: Number(
					((completedEnrollments.value / totalEnrollments.value) * 100).toFixed(
						2,
					),
				);

	return {
		filters: {
			from: from.toISOString(),
			to: to.toISOString(),
			period,
			limit,
		},
		summary: {
			totalEnrollments: totalEnrollments.value,
			completedEnrollments: completedEnrollments.value,
			activeEnrollments: activeEnrollments.value,
			completionRate,
			certificatesIssued: certificatesIssued.value,
		},
		charts: {
			enrollmentTrend,
			completionTrend,
		},
		tables: {
			completionByCourse,
			lessonDropoff,
		},
	};
};
