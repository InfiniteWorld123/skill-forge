import { and, count, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "../../../db/db.js";
import {
	certificate,
	course,
	courseReview,
	enrollment,
	lessonQuestion,
	payment,
	purchaseOrder,
	teacherProfile,
	user,
} from "../../../db/schemas/schema.js";
import type {
	GetDashboardChartsQuery,
	GetRecentActivityQuery,
} from "./dashboard.validation.js";
import {
	buildDashboardActivity,
	getCompletionRate,
	getDashboardDateRange,
	getLast30DaysRange,
	getRecentActivityLimit,
	mergeCourseChartRows,
	sortDashboardActivities,
} from "./dashboard.utils.js";

export const getDashboardOverviewService = async () => {
	const generatedAt = new Date();
	const last30Days = getLast30DaysRange();

	const last30UserFilter = and(
		gte(user.createdAt, last30Days.from),
		lte(user.createdAt, last30Days.to),
	);
	const last30CourseFilter = and(
		gte(course.createdAt, last30Days.from),
		lte(course.createdAt, last30Days.to),
	);
	const last30EnrollmentFilter = and(
		gte(enrollment.enrolledAt, last30Days.from),
		lte(enrollment.enrolledAt, last30Days.to),
	);
	const last30CompletionFilter = and(
		gte(enrollment.completedAt, last30Days.from),
		lte(enrollment.completedAt, last30Days.to),
	);
	const last30CertificateFilter = and(
		gte(certificate.issuedAt, last30Days.from),
		lte(certificate.issuedAt, last30Days.to),
	);
	const last30ReviewFilter = and(
		gte(courseReview.createdAt, last30Days.from),
		lte(courseReview.createdAt, last30Days.to),
	);
	const last30QuestionFilter = and(
		gte(lessonQuestion.createdAt, last30Days.from),
		lte(lessonQuestion.createdAt, last30Days.to),
	);
	const last30PaidOrderFilter = and(
		eq(purchaseOrder.status, "paid"),
		gte(purchaseOrder.paidAt, last30Days.from),
		lte(purchaseOrder.paidAt, last30Days.to),
	);

	const [
		[totalUsers],
		[totalTeachers],
		courseStatusRows,
		enrollmentStatusRows,
		[totalCertificates],
		[reviewSummary],
		questionStatusRows,
		orderStatusRows,
		[revenueSummary],
		[failedPayments],
		[newUsers],
		[newCourses],
		[newEnrollments],
		[completedEnrollmentsLast30Days],
		[issuedCertificates],
		[newReviews],
		[newQuestions],
		[last30Revenue],
	] = await Promise.all([
		db.select({ value: count() }).from(user),
		db.select({ value: count() }).from(teacherProfile),
		db
			.select({
				status: course.status,
				count: count(),
			})
			.from(course)
			.groupBy(course.status),
		db
			.select({
				status: enrollment.status,
				count: count(),
			})
			.from(enrollment)
			.groupBy(enrollment.status),
		db.select({ value: count() }).from(certificate),
		db
			.select({
				reviews: count(courseReview.id),
				averageRating: sql<number>`coalesce(avg(${courseReview.rating}), 0)::float8`,
			})
			.from(courseReview),
		db
			.select({
				status: lessonQuestion.status,
				count: count(),
			})
			.from(lessonQuestion)
			.groupBy(lessonQuestion.status),
		db
			.select({
				status: purchaseOrder.status,
				count: count(),
			})
			.from(purchaseOrder)
			.groupBy(purchaseOrder.status),
		db
			.select({
				totalRevenueCents: sql<number>`coalesce(sum(${purchaseOrder.totalCents}), 0)::int`,
				averageOrderValueCents: sql<number>`coalesce(avg(${purchaseOrder.totalCents}), 0)::float8`,
			})
			.from(purchaseOrder)
			.where(eq(purchaseOrder.status, "paid")),
		db
			.select({ value: count() })
			.from(payment)
			.where(eq(payment.status, "failed")),
		db.select({ value: count() }).from(user).where(last30UserFilter),
		db.select({ value: count() }).from(course).where(last30CourseFilter),
		db
			.select({ value: count() })
			.from(enrollment)
			.where(last30EnrollmentFilter),
		db
			.select({ value: count() })
			.from(enrollment)
			.where(last30CompletionFilter),
		db
			.select({ value: count() })
			.from(certificate)
			.where(last30CertificateFilter),
		db.select({ value: count() }).from(courseReview).where(last30ReviewFilter),
		db
			.select({ value: count() })
			.from(lessonQuestion)
			.where(last30QuestionFilter),
		db
			.select({
				revenueCents: sql<number>`coalesce(sum(${purchaseOrder.totalCents}), 0)::int`,
				paidOrders: count(purchaseOrder.id),
			})
			.from(purchaseOrder)
			.where(last30PaidOrderFilter),
	]);

	const courseStatusCounts = {
		draft: 0,
		published: 0,
		archived: 0,
	};

	for (const row of courseStatusRows) {
		courseStatusCounts[row.status] = row.count;
	}

	const enrollmentStatusCounts = {
		active: 0,
		completed: 0,
		refunded: 0,
		revoked: 0,
	};

	for (const row of enrollmentStatusRows) {
		enrollmentStatusCounts[row.status] = row.count;
	}

	const questionStatusCounts = {
		open: 0,
		answered: 0,
		closed: 0,
	};

	for (const row of questionStatusRows) {
		questionStatusCounts[row.status] = row.count;
	}

	const orderStatusCounts = {
		pending: 0,
		paid: 0,
		failed: 0,
		refunded: 0,
	};

	for (const row of orderStatusRows) {
		orderStatusCounts[row.status] = row.count;
	}

	const totalCourses =
		courseStatusCounts.draft +
		courseStatusCounts.published +
		courseStatusCounts.archived;
	const totalEnrollments =
		enrollmentStatusCounts.active +
		enrollmentStatusCounts.completed +
		enrollmentStatusCounts.refunded +
		enrollmentStatusCounts.revoked;
	const totalQuestions =
		questionStatusCounts.open +
		questionStatusCounts.answered +
		questionStatusCounts.closed;

	return {
		generatedAt,
		totals: {
			users: totalUsers.value,
			teachers: totalTeachers.value,
			courses: totalCourses,
			publishedCourses: courseStatusCounts.published,
			draftCourses: courseStatusCounts.draft,
			archivedCourses: courseStatusCounts.archived,
			enrollments: totalEnrollments,
			activeEnrollments: enrollmentStatusCounts.active,
			completedEnrollments: enrollmentStatusCounts.completed,
			certificates: totalCertificates.value,
			reviews: reviewSummary.reviews,
			lessonQuestions: totalQuestions,
		},
		revenue: {
			totalRevenueCents: revenueSummary.totalRevenueCents,
			paidOrders: orderStatusCounts.paid,
			pendingOrders: orderStatusCounts.pending,
			failedOrders: orderStatusCounts.failed,
			refundedOrders: orderStatusCounts.refunded,
			averageOrderValueCents: revenueSummary.averageOrderValueCents,
			failedPayments: failedPayments.value,
		},
		learning: {
			completionRate: getCompletionRate({
				completed: enrollmentStatusCounts.completed,
				total: totalEnrollments,
			}),
			averageRating: reviewSummary.averageRating,
			openQuestions: questionStatusCounts.open,
			answeredQuestions: questionStatusCounts.answered,
		},
		last30Days: {
			from: last30Days.from,
			to: last30Days.to,
			newUsers: newUsers.value,
			newCourses: newCourses.value,
			newEnrollments: newEnrollments.value,
			completedEnrollments: completedEnrollmentsLast30Days.value,
			issuedCertificates: issuedCertificates.value,
			reviews: newReviews.value,
			questions: newQuestions.value,
			revenueCents: last30Revenue.revenueCents,
			paidOrders: last30Revenue.paidOrders,
		},
	};
};

export const getRecentActivityService = async (
	query: GetRecentActivityQuery,
) => {
	const limit = getRecentActivityLimit(query);

	const [
		userRows,
		teacherRows,
		courseCreatedRows,
		coursePublishedRows,
		orderPaidRows,
		paymentFailedRows,
		enrollmentCreatedRows,
		enrollmentCompletedRows,
		reviewRows,
		questionRows,
		certificateRows,
	] = await Promise.all([
		db
			.select({
				id: user.id,
				name: user.name,
				email: user.email,
				image: user.image,
				role: user.role,
				emailVerified: user.emailVerified,
				createdAt: user.createdAt,
			})
			.from(user)
			.orderBy(desc(user.createdAt))
			.limit(limit),
		db
			.select({
				id: teacherProfile.id,
				headline: teacherProfile.headline,
				isPublic: teacherProfile.isPublic,
				createdAt: teacherProfile.createdAt,
				teacher: {
					id: user.id,
					name: user.name,
					email: user.email,
					image: user.image,
				},
			})
			.from(teacherProfile)
			.innerJoin(user, eq(teacherProfile.userId, user.id))
			.orderBy(desc(teacherProfile.createdAt))
			.limit(limit),
		db
			.select({
				id: course.id,
				title: course.title,
				slug: course.slug,
				status: course.status,
				priceCents: course.priceCents,
				currency: course.currency,
				createdAt: course.createdAt,
				teacher: {
					id: user.id,
					name: user.name,
					email: user.email,
					image: user.image,
				},
			})
			.from(course)
			.innerJoin(teacherProfile, eq(course.teacherProfileId, teacherProfile.id))
			.innerJoin(user, eq(teacherProfile.userId, user.id))
			.orderBy(desc(course.createdAt))
			.limit(limit),
		db
			.select({
				id: course.id,
				title: course.title,
				slug: course.slug,
				status: course.status,
				publishedAt: course.publishedAt,
				createdAt: course.createdAt,
				teacher: {
					id: user.id,
					name: user.name,
					email: user.email,
					image: user.image,
				},
			})
			.from(course)
			.innerJoin(teacherProfile, eq(course.teacherProfileId, teacherProfile.id))
			.innerJoin(user, eq(teacherProfile.userId, user.id))
			.where(and(eq(course.status, "published"), sql`${course.publishedAt} is not null`))
			.orderBy(desc(course.publishedAt))
			.limit(limit),
		db
			.select({
				id: purchaseOrder.id,
				totalCents: purchaseOrder.totalCents,
				currency: purchaseOrder.currency,
				status: purchaseOrder.status,
				createdAt: purchaseOrder.createdAt,
				paidAt: purchaseOrder.paidAt,
				buyer: {
					id: user.id,
					name: user.name,
					email: user.email,
					image: user.image,
				},
			})
			.from(purchaseOrder)
			.innerJoin(user, eq(purchaseOrder.userId, user.id))
			.where(and(eq(purchaseOrder.status, "paid"), sql`${purchaseOrder.paidAt} is not null`))
			.orderBy(desc(purchaseOrder.paidAt))
			.limit(limit),
		db
			.select({
				id: payment.id,
				orderId: payment.orderId,
				provider: payment.provider,
				amountCents: payment.amountCents,
				currency: payment.currency,
				providerCheckoutId: payment.providerCheckoutId,
				providerPaymentId: payment.providerPaymentId,
				rawProviderStatus: payment.rawProviderStatus,
				createdAt: payment.createdAt,
				updatedAt: payment.updatedAt,
				buyer: {
					id: user.id,
					name: user.name,
					email: user.email,
					image: user.image,
				},
			})
			.from(payment)
			.innerJoin(purchaseOrder, eq(payment.orderId, purchaseOrder.id))
			.innerJoin(user, eq(purchaseOrder.userId, user.id))
			.where(eq(payment.status, "failed"))
			.orderBy(desc(payment.updatedAt))
			.limit(limit),
		db
			.select({
				id: enrollment.id,
				status: enrollment.status,
				enrolledAt: enrollment.enrolledAt,
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
			})
			.from(enrollment)
			.innerJoin(user, eq(enrollment.userId, user.id))
			.innerJoin(course, eq(enrollment.courseId, course.id))
			.orderBy(desc(enrollment.enrolledAt))
			.limit(limit),
		db
			.select({
				id: enrollment.id,
				status: enrollment.status,
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
			})
			.from(enrollment)
			.innerJoin(user, eq(enrollment.userId, user.id))
			.innerJoin(course, eq(enrollment.courseId, course.id))
			.where(sql`${enrollment.completedAt} is not null`)
			.orderBy(desc(enrollment.completedAt))
			.limit(limit),
		db
			.select({
				id: courseReview.id,
				rating: courseReview.rating,
				title: courseReview.title,
				createdAt: courseReview.createdAt,
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
			})
			.from(courseReview)
			.innerJoin(user, eq(courseReview.userId, user.id))
			.innerJoin(course, eq(courseReview.courseId, course.id))
			.orderBy(desc(courseReview.createdAt))
			.limit(limit),
		db
			.select({
				id: lessonQuestion.id,
				title: lessonQuestion.title,
				status: lessonQuestion.status,
				createdAt: lessonQuestion.createdAt,
				student: {
					id: user.id,
					name: user.name,
					email: user.email,
					image: user.image,
				},
			})
			.from(lessonQuestion)
			.innerJoin(user, eq(lessonQuestion.userId, user.id))
			.orderBy(desc(lessonQuestion.createdAt))
			.limit(limit),
		db
			.select({
				id: certificate.id,
				certificateCode: certificate.certificateCode,
				issuedAt: certificate.issuedAt,
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
			})
			.from(certificate)
			.innerJoin(user, eq(certificate.userId, user.id))
			.innerJoin(course, eq(certificate.courseId, course.id))
			.orderBy(desc(certificate.issuedAt))
			.limit(limit),
	]);

	const activities = [
		...userRows.map((row) =>
			buildDashboardActivity({
				id: `user:${row.id}`,
				type: "user_registered",
				occurredAt: row.createdAt,
				title: "New user registered",
				description: `${row.name} joined the platform.`,
				actor: {
					id: row.id,
					name: row.name,
					email: row.email,
					image: row.image,
				},
				target: {
					id: row.id,
					type: "user",
					label: row.name,
				},
				metadata: {
					role: row.role,
					emailVerified: row.emailVerified,
				},
			}),
		),
		...teacherRows.map((row) =>
			buildDashboardActivity({
				id: `teacher:${row.id}`,
				type: "teacher_created",
				occurredAt: row.createdAt,
				title: "New teacher profile",
				description: `${row.teacher.name} created a teacher profile.`,
				actor: row.teacher,
				target: {
					id: row.id,
					type: "teacherProfile",
					label: row.teacher.name,
				},
				metadata: {
					headline: row.headline,
					isPublic: row.isPublic,
				},
			}),
		),
		...courseCreatedRows.map((row) =>
			buildDashboardActivity({
				id: `course-created:${row.id}`,
				type: "course_created",
				occurredAt: row.createdAt,
				title: "Course created",
				description: `${row.teacher.name} created ${row.title}.`,
				actor: row.teacher,
				target: {
					id: row.id,
					type: "course",
					label: row.title,
				},
				metadata: {
					slug: row.slug,
					status: row.status,
					priceCents: row.priceCents,
					currency: row.currency,
				},
			}),
		),
		...coursePublishedRows.map((row) =>
			buildDashboardActivity({
				id: `course-published:${row.id}`,
				type: "course_published",
				occurredAt: row.publishedAt ?? row.createdAt,
				title: "Course published",
				description: `${row.title} is now published.`,
				actor: row.teacher,
				target: {
					id: row.id,
					type: "course",
					label: row.title,
				},
				metadata: {
					slug: row.slug,
					status: row.status,
				},
			}),
		),
		...orderPaidRows.map((row) =>
			buildDashboardActivity({
				id: `order-paid:${row.id}`,
				type: "order_paid",
				occurredAt: row.paidAt ?? row.createdAt,
				title: "Order paid",
				description: `${row.buyer.name} paid an order.`,
				actor: row.buyer,
				target: {
					id: row.id,
					type: "purchaseOrder",
					label: row.id,
				},
				metadata: {
					totalCents: row.totalCents,
					currency: row.currency,
					status: row.status,
				},
			}),
		),
		...paymentFailedRows.map((row) =>
			buildDashboardActivity({
				id: `payment-failed:${row.id}`,
				type: "payment_failed",
				occurredAt: row.updatedAt,
				title: "Payment failed",
				description: `${row.buyer.name} had a failed payment.`,
				actor: row.buyer,
				target: {
					id: row.id,
					type: "payment",
					label: row.providerPaymentId ?? row.providerCheckoutId ?? row.id,
				},
				metadata: {
					orderId: row.orderId,
					provider: row.provider,
					amountCents: row.amountCents,
					currency: row.currency,
					rawProviderStatus: row.rawProviderStatus,
				},
			}),
		),
		...enrollmentCreatedRows.map((row) =>
			buildDashboardActivity({
				id: `enrollment-created:${row.id}`,
				type: "enrollment_created",
				occurredAt: row.enrolledAt,
				title: "Enrollment created",
				description: `${row.student.name} enrolled in ${row.course.title}.`,
				actor: row.student,
				target: {
					id: row.id,
					type: "enrollment",
					label: row.course.title,
				},
				metadata: {
					status: row.status,
					course: row.course,
				},
			}),
		),
		...enrollmentCompletedRows.map((row) =>
			buildDashboardActivity({
				id: `enrollment-completed:${row.id}`,
				type: "enrollment_completed",
				occurredAt: row.completedAt ?? row.updatedAt,
				title: "Course completed",
				description: `${row.student.name} completed ${row.course.title}.`,
				actor: row.student,
				target: {
					id: row.id,
					type: "enrollment",
					label: row.course.title,
				},
				metadata: {
					status: row.status,
					course: row.course,
				},
			}),
		),
		...reviewRows.map((row) =>
			buildDashboardActivity({
				id: `review:${row.id}`,
				type: "review_created",
				occurredAt: row.createdAt,
				title: "Review posted",
				description: `${row.student.name} rated ${row.course.title}.`,
				actor: row.student,
				target: {
					id: row.id,
					type: "courseReview",
					label: row.title ?? row.course.title,
				},
				metadata: {
					rating: row.rating,
					course: row.course,
				},
			}),
		),
		...questionRows.map((row) =>
			buildDashboardActivity({
				id: `question:${row.id}`,
				type: "question_created",
				occurredAt: row.createdAt,
				title: "Question asked",
				description: `${row.student.name} asked a lesson question.`,
				actor: row.student,
				target: {
					id: row.id,
					type: "lessonQuestion",
					label: row.title,
				},
				metadata: {
					status: row.status,
				},
			}),
		),
		...certificateRows.map((row) =>
			buildDashboardActivity({
				id: `certificate:${row.id}`,
				type: "certificate_issued",
				occurredAt: row.issuedAt,
				title: "Certificate issued",
				description: `${row.student.name} earned a certificate for ${row.course.title}.`,
				actor: row.student,
				target: {
					id: row.id,
					type: "certificate",
					label: row.certificateCode,
				},
				metadata: {
					certificateCode: row.certificateCode,
					course: row.course,
				},
			}),
		),
	];

	const items = sortDashboardActivities(activities, limit);

	return {
		filters: {
			limit,
		},
		pagination: {
			limit,
			count: items.length,
		},
		items,
	};
};

export const getDashboardChartsService = async (
	query: GetDashboardChartsQuery,
) => {
	const { from, to, period } = getDashboardDateRange(query);

	const dashboardPeriod = sql.raw(`'${period}'`);
	const userPeriodExpression = sql<string>`
		date_trunc(${dashboardPeriod}, ${user.createdAt})::date
	`;
	const revenuePeriodExpression = sql<string>`
		date_trunc(${dashboardPeriod}, ${purchaseOrder.paidAt})::date
	`;
	const enrollmentPeriodExpression = sql<string>`
		date_trunc(${dashboardPeriod}, ${enrollment.enrolledAt})::date
	`;
	const completionPeriodExpression = sql<string>`
		date_trunc(${dashboardPeriod}, ${enrollment.completedAt})::date
	`;
	const certificatePeriodExpression = sql<string>`
		date_trunc(${dashboardPeriod}, ${certificate.issuedAt})::date
	`;
	const reviewPeriodExpression = sql<string>`
		date_trunc(${dashboardPeriod}, ${courseReview.createdAt})::date
	`;
	const questionPeriodExpression = sql<string>`
		date_trunc(${dashboardPeriod}, ${lessonQuestion.createdAt})::date
	`;
	const courseCreatedPeriodExpression = sql<string>`
		date_trunc(${dashboardPeriod}, ${course.createdAt})::date
	`;
	const coursePublishedPeriodExpression = sql<string>`
		date_trunc(${dashboardPeriod}, ${course.publishedAt})::date
	`;

	const [
		users,
		revenue,
		enrollments,
		completions,
		certificates,
		reviews,
		questions,
		courseCreatedRows,
		coursePublishedRows,
	] = await Promise.all([
		db
			.select({
				period: userPeriodExpression,
				count: count(),
			})
			.from(user)
			.where(and(gte(user.createdAt, from), lte(user.createdAt, to)))
			.groupBy(userPeriodExpression)
			.orderBy(userPeriodExpression),
		db
			.select({
				period: revenuePeriodExpression,
				revenueCents: sql<number>`coalesce(sum(${purchaseOrder.totalCents}), 0)::int`,
				orders: count(purchaseOrder.id),
			})
			.from(purchaseOrder)
			.where(
				and(
					eq(purchaseOrder.status, "paid"),
					gte(purchaseOrder.paidAt, from),
					lte(purchaseOrder.paidAt, to),
				),
			)
			.groupBy(revenuePeriodExpression)
			.orderBy(revenuePeriodExpression),
		db
			.select({
				period: enrollmentPeriodExpression,
				count: count(),
			})
			.from(enrollment)
			.where(and(gte(enrollment.enrolledAt, from), lte(enrollment.enrolledAt, to)))
			.groupBy(enrollmentPeriodExpression)
			.orderBy(enrollmentPeriodExpression),
		db
			.select({
				period: completionPeriodExpression,
				count: count(),
			})
			.from(enrollment)
			.where(
				and(
					gte(enrollment.completedAt, from),
					lte(enrollment.completedAt, to),
				),
			)
			.groupBy(completionPeriodExpression)
			.orderBy(completionPeriodExpression),
		db
			.select({
				period: certificatePeriodExpression,
				count: count(),
			})
			.from(certificate)
			.where(and(gte(certificate.issuedAt, from), lte(certificate.issuedAt, to)))
			.groupBy(certificatePeriodExpression)
			.orderBy(certificatePeriodExpression),
		db
			.select({
				period: reviewPeriodExpression,
				count: count(),
				averageRating: sql<number>`coalesce(avg(${courseReview.rating}), 0)::float8`,
			})
			.from(courseReview)
			.where(and(gte(courseReview.createdAt, from), lte(courseReview.createdAt, to)))
			.groupBy(reviewPeriodExpression)
			.orderBy(reviewPeriodExpression),
		db
			.select({
				period: questionPeriodExpression,
				count: count(),
			})
			.from(lessonQuestion)
			.where(
				and(gte(lessonQuestion.createdAt, from), lte(lessonQuestion.createdAt, to)),
			)
			.groupBy(questionPeriodExpression)
			.orderBy(questionPeriodExpression),
		db
			.select({
				period: courseCreatedPeriodExpression,
				count: count(),
			})
			.from(course)
			.where(and(gte(course.createdAt, from), lte(course.createdAt, to)))
			.groupBy(courseCreatedPeriodExpression)
			.orderBy(courseCreatedPeriodExpression),
		db
			.select({
				period: coursePublishedPeriodExpression,
				count: count(),
			})
			.from(course)
			.where(
				and(
					eq(course.status, "published"),
					gte(course.publishedAt, from),
					lte(course.publishedAt, to),
				),
			)
			.groupBy(coursePublishedPeriodExpression)
			.orderBy(coursePublishedPeriodExpression),
	]);

	return {
		filters: {
			from: from.toISOString(),
			to: to.toISOString(),
			period,
		},
		charts: {
			users,
			revenue,
			enrollments,
			completions,
			certificates,
			reviews,
			questions,
			courses: mergeCourseChartRows({
				createdRows: courseCreatedRows,
				publishedRows: coursePublishedRows,
			}),
		},
	};
};
