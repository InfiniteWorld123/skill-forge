import { count, eq, sql } from "drizzle-orm";
import { db } from "../../../db/db.js";
import {
	course,
	courseReview,
	enrollment,
	user,
} from "../../../db/schemas/schema.js";
import { notFoundError } from "../../../shared/constants/errors.js";
import type {
	GetReviewsSummaryQuery,
	ListReviewsQuery,
} from "./reviews.validation.js";
import {
	getListReviewsSort,
	getPagination,
	getPaginationMeta,
	getReviewFilterValues,
	getReviewFilters,
} from "./reviews.utils.js";

export const listReviewsService = async (query: ListReviewsQuery) => {
	const { limit, offset } = getPagination(query);
	const where = getReviewFilters(query);

	const [totalRow] = await db
		.select({ value: count() })
		.from(courseReview)
		.innerJoin(user, eq(courseReview.userId, user.id))
		.innerJoin(course, eq(courseReview.courseId, course.id))
		.innerJoin(enrollment, eq(courseReview.enrollmentId, enrollment.id))
		.where(where);

	const reviews = await db
		.select({
			id: courseReview.id,
			rating: courseReview.rating,
			title: courseReview.title,
			body: courseReview.body,
			createdAt: courseReview.createdAt,
			updatedAt: courseReview.updatedAt,
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
		})
		.from(courseReview)
		.innerJoin(user, eq(courseReview.userId, user.id))
		.innerJoin(course, eq(courseReview.courseId, course.id))
		.innerJoin(enrollment, eq(courseReview.enrollmentId, enrollment.id))
		.where(where)
		.orderBy(getListReviewsSort(query.sortBy, query.sortDirection))
		.limit(limit)
		.offset(offset);

	return {
		filters: {
			...getReviewFilterValues(query),
			limit,
			offset,
			sortBy: query.sortBy ?? "createdAt",
			sortDirection: query.sortDirection ?? "desc",
		},
		pagination: getPaginationMeta({
			total: totalRow.value,
			limit,
			offset,
			itemCount: reviews.length,
		}),
		reviews,
	};
};

export const getReviewsSummaryService = async (
	query: GetReviewsSummaryQuery,
) => {
	const where = getReviewFilters(query);

	const [summaryRow] = await db
		.select({
			reviewCount: count(courseReview.id),
			averageRating: sql<number>`coalesce(avg(${courseReview.rating}), 0)::float8`,
		})
		.from(courseReview)
		.innerJoin(user, eq(courseReview.userId, user.id))
		.innerJoin(course, eq(courseReview.courseId, course.id))
		.innerJoin(enrollment, eq(courseReview.enrollmentId, enrollment.id))
		.where(where);

	const distributionRows = await db
		.select({
			rating: courseReview.rating,
			count: count(courseReview.id),
		})
		.from(courseReview)
		.innerJoin(user, eq(courseReview.userId, user.id))
		.innerJoin(course, eq(courseReview.courseId, course.id))
		.innerJoin(enrollment, eq(courseReview.enrollmentId, enrollment.id))
		.where(where)
		.groupBy(courseReview.rating);

	const ratingDistribution: Record<1 | 2 | 3 | 4 | 5, number> = {
		1: 0,
		2: 0,
		3: 0,
		4: 0,
		5: 0,
	};

	for (const row of distributionRows) {
		if (row.rating >= 1 && row.rating <= 5) {
			ratingDistribution[row.rating as 1 | 2 | 3 | 4 | 5] = row.count;
		}
	}

	return {
		filters: getReviewFilterValues(query),
		summary: {
			averageRating: summaryRow.averageRating,
			reviewCount: summaryRow.reviewCount,
			ratingDistribution,
		},
	};
};

export const getReviewDetailsService = async (reviewId: string) => {
	const [details] = await db
		.select({
			review: {
				id: courseReview.id,
				enrollmentId: courseReview.enrollmentId,
				userId: courseReview.userId,
				courseId: courseReview.courseId,
				rating: courseReview.rating,
				title: courseReview.title,
				body: courseReview.body,
				createdAt: courseReview.createdAt,
				updatedAt: courseReview.updatedAt,
			},
			student: {
				id: user.id,
				name: user.name,
				email: user.email,
				emailVerified: user.emailVerified,
				image: user.image,
				role: user.role,
				banned: user.banned,
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
			enrollment: {
				id: enrollment.id,
				status: enrollment.status,
				enrolledAt: enrollment.enrolledAt,
				completedAt: enrollment.completedAt,
				updatedAt: enrollment.updatedAt,
			},
		})
		.from(courseReview)
		.innerJoin(user, eq(courseReview.userId, user.id))
		.innerJoin(course, eq(courseReview.courseId, course.id))
		.innerJoin(enrollment, eq(courseReview.enrollmentId, enrollment.id))
		.where(eq(courseReview.id, reviewId));

	if (!details) {
		throw notFoundError("Review not found");
	}

	return details;
};
