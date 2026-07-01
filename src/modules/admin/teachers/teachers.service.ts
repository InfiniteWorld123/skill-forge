import {
	count,
	desc,
	eq,
	sql,
} from "drizzle-orm";
import { db } from "../../../db/db.js";
import {
	course,
	courseReview,
	enrollment,
	purchaseOrderItem,
	teacherProfile,
	user,
} from "../../../db/schemas/schema.js";
import { notFoundError } from "../../../shared/constants/errors.js";
import type {
	ListTeachersQuery,
	UpdateTeacherVisibilityInput,
} from "./teachers.validation.js";
import {
	getTeacherFilters,
	getTeacherPagination,
	getTeacherPaginationMeta,
	getTeacherSort,
} from "./teachers.utils.js";

const teacherCourseStats = db
	.select({
		teacherProfileId: course.teacherProfileId,
		courseCount: count(course.id).as("course_count"),
		draftCourseCount:
			sql<number>`count(*) filter (where ${course.status} = 'draft')::int`.as(
				"draft_course_count",
			),
		publishedCourseCount:
			sql<number>`count(*) filter (where ${course.status} = 'published')::int`.as(
				"published_course_count",
			),
		archivedCourseCount:
			sql<number>`count(*) filter (where ${course.status} = 'archived')::int`.as(
				"archived_course_count",
			),
	})
	.from(course)
	.groupBy(course.teacherProfileId)
	.as("teacher_course_stats");

const teacherEnrollmentStats = db
	.select({
		teacherProfileId: course.teacherProfileId,
		enrollmentCount: count(enrollment.id).as("enrollment_count"),
		activeEnrollmentCount:
			sql<number>`count(${enrollment.id}) filter (where ${enrollment.status} = 'active')::int`.as(
				"active_enrollment_count",
			),
		completedEnrollmentCount:
			sql<number>`count(${enrollment.id}) filter (where ${enrollment.status} = 'completed')::int`.as(
				"completed_enrollment_count",
			),
	})
	.from(course)
	.leftJoin(enrollment, eq(enrollment.courseId, course.id))
	.groupBy(course.teacherProfileId)
	.as("teacher_enrollment_stats");

const teacherReviewStats = db
	.select({
		teacherProfileId: course.teacherProfileId,
		averageRating:
			sql<number>`coalesce(avg(${courseReview.rating}), 0)::float8`.as(
				"average_rating",
			),
		reviewCount: count(courseReview.id).as("review_count"),
	})
	.from(course)
	.leftJoin(courseReview, eq(courseReview.courseId, course.id))
	.groupBy(course.teacherProfileId)
	.as("teacher_review_stats");

const teacherPurchaseStats = db
	.select({
		teacherProfileId: course.teacherProfileId,
		purchaseCount: count(purchaseOrderItem.id).as("purchase_count"),
		grossRevenueCents:
			sql<number>`coalesce(sum(${purchaseOrderItem.priceCents}), 0)::int`.as(
				"gross_revenue_cents",
			),
	})
	.from(course)
	.leftJoin(purchaseOrderItem, eq(purchaseOrderItem.courseId, course.id))
	.groupBy(course.teacherProfileId)
	.as("teacher_purchase_stats");

const courseEnrollmentStats = db
	.select({
		courseId: enrollment.courseId,
		enrollmentCount: count(enrollment.id).as("enrollment_count"),
		activeEnrollmentCount:
			sql<number>`count(${enrollment.id}) filter (where ${enrollment.status} = 'active')::int`.as(
				"active_enrollment_count",
			),
		completedEnrollmentCount:
			sql<number>`count(${enrollment.id}) filter (where ${enrollment.status} = 'completed')::int`.as(
				"completed_enrollment_count",
			),
	})
	.from(enrollment)
	.groupBy(enrollment.courseId)
	.as("course_enrollment_stats");

const courseReviewStats = db
	.select({
		courseId: courseReview.courseId,
		averageRating:
			sql<number>`coalesce(avg(${courseReview.rating}), 0)::float8`.as(
				"average_rating",
			),
		reviewCount: count(courseReview.id).as("review_count"),
	})
	.from(courseReview)
	.groupBy(courseReview.courseId)
	.as("course_review_stats");

const coursePurchaseStats = db
	.select({
		courseId: purchaseOrderItem.courseId,
		purchaseCount: count(purchaseOrderItem.id).as("purchase_count"),
		grossRevenueCents:
			sql<number>`coalesce(sum(${purchaseOrderItem.priceCents}), 0)::int`.as(
				"gross_revenue_cents",
			),
	})
	.from(purchaseOrderItem)
	.groupBy(purchaseOrderItem.courseId)
	.as("course_purchase_stats");

const teacherStatColumns = {
	courseCount: sql<number>`coalesce(${teacherCourseStats.courseCount}, 0)::int`,
	enrollmentCount:
		sql<number>`coalesce(${teacherEnrollmentStats.enrollmentCount}, 0)::int`,
	averageRating:
		sql<number>`coalesce(${teacherReviewStats.averageRating}, 0)::float8`,
};

export const listTeachersService = async (query: ListTeachersQuery) => {
	const { limit, offset } = getTeacherPagination(query);
	const where = getTeacherFilters(query);
	const sortBy = query.sortBy ?? "createdAt";
	const sortDirection = query.sortDirection ?? "desc";

	const [totalRow] = await db
		.select({ value: count() })
		.from(teacherProfile)
		.innerJoin(user, eq(teacherProfile.userId, user.id))
		.where(where);

	const rows = await db
		.select({
			teacherProfile: {
				id: teacherProfile.id,
				headline: teacherProfile.headline,
				expertise: teacherProfile.expertise,
				experience: teacherProfile.experience,
				education: teacherProfile.education,
				websiteUrl: teacherProfile.websiteUrl,
				linkedinUrl: teacherProfile.linkedinUrl,
				githubUrl: teacherProfile.githubUrl,
				youtubeUrl: teacherProfile.youtubeUrl,
				isPublic: teacherProfile.isPublic,
				createdAt: teacherProfile.createdAt,
				updatedAt: teacherProfile.updatedAt,
			},
			user: {
				id: user.id,
				name: user.name,
				email: user.email,
				image: user.image,
				emailVerified: user.emailVerified,
				banned: user.banned,
				createdAt: user.createdAt,
			},
			courseCount: teacherStatColumns.courseCount,
			publishedCourseCount:
				sql<number>`coalesce(${teacherCourseStats.publishedCourseCount}, 0)::int`,
			enrollmentCount: teacherStatColumns.enrollmentCount,
			purchaseCount:
				sql<number>`coalesce(${teacherPurchaseStats.purchaseCount}, 0)::int`,
			grossRevenueCents:
				sql<number>`coalesce(${teacherPurchaseStats.grossRevenueCents}, 0)::int`,
			averageRating: teacherStatColumns.averageRating,
			reviewCount:
				sql<number>`coalesce(${teacherReviewStats.reviewCount}, 0)::int`,
		})
		.from(teacherProfile)
		.innerJoin(user, eq(teacherProfile.userId, user.id))
		.leftJoin(
			teacherCourseStats,
			eq(teacherCourseStats.teacherProfileId, teacherProfile.id),
		)
		.leftJoin(
			teacherEnrollmentStats,
			eq(teacherEnrollmentStats.teacherProfileId, teacherProfile.id),
		)
		.leftJoin(
			teacherReviewStats,
			eq(teacherReviewStats.teacherProfileId, teacherProfile.id),
		)
		.leftJoin(
			teacherPurchaseStats,
			eq(teacherPurchaseStats.teacherProfileId, teacherProfile.id),
		)
		.where(where)
		.orderBy(getTeacherSort(teacherStatColumns, sortBy, sortDirection))
		.limit(limit)
		.offset(offset);

	const items = rows.map((row) => ({
		teacherProfile: row.teacherProfile,
		user: row.user,
		stats: {
			courseCount: row.courseCount,
			publishedCourseCount: row.publishedCourseCount,
			enrollmentCount: row.enrollmentCount,
			purchaseCount: row.purchaseCount,
			grossRevenueCents: row.grossRevenueCents,
			averageRating: row.averageRating,
			reviewCount: row.reviewCount,
		},
	}));

	return {
		items,
		pagination: getTeacherPaginationMeta({
			total: totalRow.value,
			limit,
			offset,
			itemCount: items.length,
		}),
		filters: {
			search: query.search ?? null,
			isPublic: query.isPublic ? query.isPublic === "true" : null,
			from: query.from ?? null,
			to: query.to ?? null,
		},
		sorting: {
			sortBy,
			sortDirection,
		},
	};
};

export const getTeacherDetailsService = async (teacherProfileId: string) => {
	const [teacher] = await db
		.select({
			teacherProfile: {
				id: teacherProfile.id,
				headline: teacherProfile.headline,
				bio: teacherProfile.bio,
				expertise: teacherProfile.expertise,
				experience: teacherProfile.experience,
				education: teacherProfile.education,
				websiteUrl: teacherProfile.websiteUrl,
				linkedinUrl: teacherProfile.linkedinUrl,
				githubUrl: teacherProfile.githubUrl,
				youtubeUrl: teacherProfile.youtubeUrl,
				isPublic: teacherProfile.isPublic,
				createdAt: teacherProfile.createdAt,
				updatedAt: teacherProfile.updatedAt,
			},
			user: {
				id: user.id,
				name: user.name,
				email: user.email,
				image: user.image,
				emailVerified: user.emailVerified,
				banned: user.banned,
				role: user.role,
				createdAt: user.createdAt,
				updatedAt: user.updatedAt,
			},
		})
		.from(teacherProfile)
		.innerJoin(user, eq(teacherProfile.userId, user.id))
		.where(eq(teacherProfile.id, teacherProfileId));

	if (!teacher) {
		throw notFoundError("Teacher profile not found");
	}

	const courseRows = await db
		.select({
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
			createdAt: course.createdAt,
			updatedAt: course.updatedAt,
			enrollmentCount:
				sql<number>`coalesce(${courseEnrollmentStats.enrollmentCount}, 0)::int`,
			activeEnrollmentCount:
				sql<number>`coalesce(${courseEnrollmentStats.activeEnrollmentCount}, 0)::int`,
			completedEnrollmentCount:
				sql<number>`coalesce(${courseEnrollmentStats.completedEnrollmentCount}, 0)::int`,
			purchaseCount:
				sql<number>`coalesce(${coursePurchaseStats.purchaseCount}, 0)::int`,
			grossRevenueCents:
				sql<number>`coalesce(${coursePurchaseStats.grossRevenueCents}, 0)::int`,
			averageRating:
				sql<number>`coalesce(${courseReviewStats.averageRating}, 0)::float8`,
			reviewCount:
				sql<number>`coalesce(${courseReviewStats.reviewCount}, 0)::int`,
		})
		.from(course)
		.leftJoin(courseEnrollmentStats, eq(courseEnrollmentStats.courseId, course.id))
		.leftJoin(coursePurchaseStats, eq(coursePurchaseStats.courseId, course.id))
		.leftJoin(courseReviewStats, eq(courseReviewStats.courseId, course.id))
		.where(eq(course.teacherProfileId, teacherProfileId))
		.orderBy(desc(course.createdAt));

	let enrollmentCount = 0;
	let activeEnrollmentCount = 0;
	let completedEnrollmentCount = 0;
	let purchaseCount = 0;
	let grossRevenueCents = 0;
	let reviewCount = 0;
	let ratingPoints = 0;

	const courses = courseRows.map((courseRow) => {
		enrollmentCount += courseRow.enrollmentCount;
		activeEnrollmentCount += courseRow.activeEnrollmentCount;
		completedEnrollmentCount += courseRow.completedEnrollmentCount;
		purchaseCount += courseRow.purchaseCount;
		grossRevenueCents += courseRow.grossRevenueCents;
		reviewCount += courseRow.reviewCount;
		ratingPoints += courseRow.averageRating * courseRow.reviewCount;

		return {
			id: courseRow.id,
			title: courseRow.title,
			slug: courseRow.slug,
			status: courseRow.status,
			level: courseRow.level,
			language: courseRow.language,
			priceCents: courseRow.priceCents,
			currency: courseRow.currency,
			publishedAt: courseRow.publishedAt,
			archivedAt: courseRow.archivedAt,
			createdAt: courseRow.createdAt,
			updatedAt: courseRow.updatedAt,
			stats: {
				enrollmentCount: courseRow.enrollmentCount,
				activeEnrollmentCount: courseRow.activeEnrollmentCount,
				completedEnrollmentCount: courseRow.completedEnrollmentCount,
				purchaseCount: courseRow.purchaseCount,
				grossRevenueCents: courseRow.grossRevenueCents,
				averageRating: courseRow.averageRating,
				reviewCount: courseRow.reviewCount,
			},
		};
	});

	return {
		teacherProfile: teacher.teacherProfile,
		user: teacher.user,
		courses,
		performance: {
			courseCount: courses.length,
			draftCourseCount: courses.filter((item) => item.status === "draft").length,
			publishedCourseCount: courses.filter((item) => item.status === "published")
				.length,
			archivedCourseCount: courses.filter((item) => item.status === "archived")
				.length,
			enrollmentCount,
			activeEnrollmentCount,
			completedEnrollmentCount,
			purchaseCount,
			grossRevenueCents,
			averageRating: reviewCount > 0 ? ratingPoints / reviewCount : 0,
			reviewCount,
		},
	};
};

export const updateTeacherVisibilityService = async (
	teacherProfileId: string,
	input: UpdateTeacherVisibilityInput,
) => {
	const [updatedTeacherProfile] = await db
		.update(teacherProfile)
		.set({ isPublic: input.isPublic })
		.where(eq(teacherProfile.id, teacherProfileId))
		.returning({
			id: teacherProfile.id,
			isPublic: teacherProfile.isPublic,
			updatedAt: teacherProfile.updatedAt,
		});

	if (!updatedTeacherProfile) {
		throw notFoundError("Teacher profile not found");
	}

	return {
		teacherProfile: updatedTeacherProfile,
	};
};
