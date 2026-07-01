import {
	and,
	count,
	countDistinct,
	eq,
	inArray,
	sql,
} from "drizzle-orm";
import { db } from "../../../db/db.js";
import {
	course,
	courseCategory,
	courseReview,
	courseSection,
	enrollment,
	lesson,
	mediaAsset,
	purchaseOrderItem,
	quizOption,
	quizQuestion,
	teacherProfile,
	user,
	wishlistItem,
} from "../../../db/schemas/schema.js";
import {
	conflictError,
	notFoundError,
} from "../../../shared/constants/errors.js";
import type {
	CoursePerformanceQuery,
	ListCoursesQuery,
	UpdateCourseBody,
	UpdateCourseStatusBody,
} from "./courses.validation.js";
import {
	buildCourseCurriculum,
	calculateCompletionRate,
	createEmptyRatingDistribution,
	getCourseDateFilters,
	getCourseFilterValues,
	getCourseFilters,
	getCoursePagination,
	getCoursePaginationMeta,
	getCoursePerformanceFilterValues,
	getCourseSort,
	isForeignKeyConstraintError,
	isUniqueConstraintError,
	nullableAsset,
} from "./courses.utils.js";

const courseContentStats = db
	.select({
		courseId: courseSection.courseId,
		sectionCount: countDistinct(courseSection.id).as("section_count"),
		lessonCount: countDistinct(lesson.id).as("lesson_count"),
		videoLessonCount:
			sql<number>`count(distinct ${lesson.id}) filter (where ${lesson.type} = 'video')::int`.as(
				"video_lesson_count",
			),
		textLessonCount:
			sql<number>`count(distinct ${lesson.id}) filter (where ${lesson.type} = 'text')::int`.as(
				"text_lesson_count",
			),
		quizLessonCount:
			sql<number>`count(distinct ${lesson.id}) filter (where ${lesson.type} = 'quiz')::int`.as(
				"quiz_lesson_count",
			),
		previewLessonCount:
			sql<number>`count(distinct ${lesson.id}) filter (where ${lesson.isPreview} = true)::int`.as(
				"preview_lesson_count",
			),
		totalDurationSeconds:
			sql<number>`coalesce(sum(${lesson.durationSeconds}), 0)::int`.as(
				"total_duration_seconds",
			),
	})
	.from(courseSection)
	.leftJoin(lesson, eq(lesson.sectionId, courseSection.id))
	.groupBy(courseSection.courseId)
	.as("course_content_stats");

const courseQuizStats = db
	.select({
		courseId: courseSection.courseId,
		quizQuestionCount: countDistinct(quizQuestion.id).as("quiz_question_count"),
		quizOptionCount: countDistinct(quizOption.id).as("quiz_option_count"),
	})
	.from(courseSection)
	.leftJoin(lesson, eq(lesson.sectionId, courseSection.id))
	.leftJoin(quizQuestion, eq(quizQuestion.lessonId, lesson.id))
	.leftJoin(quizOption, eq(quizOption.questionId, quizQuestion.id))
	.groupBy(courseSection.courseId)
	.as("course_quiz_stats");

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
		refundedEnrollmentCount:
			sql<number>`count(${enrollment.id}) filter (where ${enrollment.status} = 'refunded')::int`.as(
				"refunded_enrollment_count",
			),
		revokedEnrollmentCount:
			sql<number>`count(${enrollment.id}) filter (where ${enrollment.status} = 'revoked')::int`.as(
				"revoked_enrollment_count",
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

const courseWishlistStats = db
	.select({
		courseId: wishlistItem.courseId,
		wishlistCount: count(wishlistItem.id).as("wishlist_count"),
	})
	.from(wishlistItem)
	.groupBy(wishlistItem.courseId)
	.as("course_wishlist_stats");

const coursePurchaseStats = db
	.select({
		courseId: purchaseOrderItem.courseId,
		purchaseCount: count(purchaseOrderItem.id).as("purchase_count"),
		revenueCents:
			sql<number>`coalesce(sum(${purchaseOrderItem.priceCents}), 0)::int`.as(
				"revenue_cents",
			),
	})
	.from(purchaseOrderItem)
	.groupBy(purchaseOrderItem.courseId)
	.as("course_purchase_stats");

const courseStatColumns = {
	sectionCount:
		sql<number>`coalesce(${courseContentStats.sectionCount}, 0)::int`,
	lessonCount: sql<number>`coalesce(${courseContentStats.lessonCount}, 0)::int`,
	videoLessonCount:
		sql<number>`coalesce(${courseContentStats.videoLessonCount}, 0)::int`,
	textLessonCount:
		sql<number>`coalesce(${courseContentStats.textLessonCount}, 0)::int`,
	quizLessonCount:
		sql<number>`coalesce(${courseContentStats.quizLessonCount}, 0)::int`,
	previewLessonCount:
		sql<number>`coalesce(${courseContentStats.previewLessonCount}, 0)::int`,
	totalDurationSeconds:
		sql<number>`coalesce(${courseContentStats.totalDurationSeconds}, 0)::int`,
	quizQuestionCount:
		sql<number>`coalesce(${courseQuizStats.quizQuestionCount}, 0)::int`,
	quizOptionCount:
		sql<number>`coalesce(${courseQuizStats.quizOptionCount}, 0)::int`,
	enrollmentCount:
		sql<number>`coalesce(${courseEnrollmentStats.enrollmentCount}, 0)::int`,
	activeEnrollmentCount:
		sql<number>`coalesce(${courseEnrollmentStats.activeEnrollmentCount}, 0)::int`,
	completedEnrollmentCount:
		sql<number>`coalesce(${courseEnrollmentStats.completedEnrollmentCount}, 0)::int`,
	refundedEnrollmentCount:
		sql<number>`coalesce(${courseEnrollmentStats.refundedEnrollmentCount}, 0)::int`,
	revokedEnrollmentCount:
		sql<number>`coalesce(${courseEnrollmentStats.revokedEnrollmentCount}, 0)::int`,
	averageRating:
		sql<number>`coalesce(${courseReviewStats.averageRating}, 0)::float8`,
	reviewCount: sql<number>`coalesce(${courseReviewStats.reviewCount}, 0)::int`,
	wishlistCount:
		sql<number>`coalesce(${courseWishlistStats.wishlistCount}, 0)::int`,
	purchaseCount:
		sql<number>`coalesce(${coursePurchaseStats.purchaseCount}, 0)::int`,
	revenueCents:
		sql<number>`coalesce(${coursePurchaseStats.revenueCents}, 0)::int`,
};

const baseCourseSelection = {
	id: course.id,
	teacherProfileId: course.teacherProfileId,
	categoryId: course.categoryId,
	thumbnailAssetId: course.thumbnailAssetId,
	title: course.title,
	slug: course.slug,
	shortDescription: course.shortDescription,
	description: course.description,
	level: course.level,
	language: course.language,
	status: course.status,
	priceCents: course.priceCents,
	currency: course.currency,
	createdAt: course.createdAt,
	updatedAt: course.updatedAt,
	publishedAt: course.publishedAt,
	archivedAt: course.archivedAt,
};

const selectCourseOverviewRows = () =>
	db
		.select({
			course: baseCourseSelection,
			teacher: {
				id: teacherProfile.id,
				userId: teacherProfile.userId,
				name: user.name,
				email: user.email,
				image: user.image,
				headline: teacherProfile.headline,
				isPublic: teacherProfile.isPublic,
			},
			category: {
				id: courseCategory.id,
				name: courseCategory.name,
				slug: courseCategory.slug,
				isActive: courseCategory.isActive,
			},
			thumbnail: {
				id: mediaAsset.id,
				url: mediaAsset.url,
				mimeType: mediaAsset.mimeType,
				sizeBytes: mediaAsset.sizeBytes,
			},
			sectionCount: courseStatColumns.sectionCount,
			lessonCount: courseStatColumns.lessonCount,
			videoLessonCount: courseStatColumns.videoLessonCount,
			textLessonCount: courseStatColumns.textLessonCount,
			quizLessonCount: courseStatColumns.quizLessonCount,
			previewLessonCount: courseStatColumns.previewLessonCount,
			totalDurationSeconds: courseStatColumns.totalDurationSeconds,
			quizQuestionCount: courseStatColumns.quizQuestionCount,
			quizOptionCount: courseStatColumns.quizOptionCount,
			enrollmentCount: courseStatColumns.enrollmentCount,
			activeEnrollmentCount: courseStatColumns.activeEnrollmentCount,
			completedEnrollmentCount: courseStatColumns.completedEnrollmentCount,
			refundedEnrollmentCount: courseStatColumns.refundedEnrollmentCount,
			revokedEnrollmentCount: courseStatColumns.revokedEnrollmentCount,
			averageRating: courseStatColumns.averageRating,
			reviewCount: courseStatColumns.reviewCount,
			wishlistCount: courseStatColumns.wishlistCount,
			purchaseCount: courseStatColumns.purchaseCount,
			revenueCents: courseStatColumns.revenueCents,
		})
		.from(course)
		.innerJoin(teacherProfile, eq(course.teacherProfileId, teacherProfile.id))
		.innerJoin(user, eq(teacherProfile.userId, user.id))
		.leftJoin(courseCategory, eq(course.categoryId, courseCategory.id))
		.leftJoin(mediaAsset, eq(course.thumbnailAssetId, mediaAsset.id))
		.leftJoin(courseContentStats, eq(courseContentStats.courseId, course.id))
		.leftJoin(courseQuizStats, eq(courseQuizStats.courseId, course.id))
		.leftJoin(courseEnrollmentStats, eq(courseEnrollmentStats.courseId, course.id))
		.leftJoin(courseReviewStats, eq(courseReviewStats.courseId, course.id))
		.leftJoin(courseWishlistStats, eq(courseWishlistStats.courseId, course.id))
		.leftJoin(coursePurchaseStats, eq(coursePurchaseStats.courseId, course.id));

const shapeCourseOverview = (
	row: Awaited<ReturnType<ReturnType<typeof selectCourseOverviewRows>["limit"]>>[number],
) => ({
	...row.course,
	teacher: row.teacher,
	category: row.category?.id ? row.category : null,
	thumbnail: nullableAsset(row.thumbnail),
	counts: {
		sections: row.sectionCount,
		lessons: row.lessonCount,
		quizQuestions: row.quizQuestionCount,
		enrollments: row.enrollmentCount,
		reviews: row.reviewCount,
		wishlists: row.wishlistCount,
		purchases: row.purchaseCount,
	},
	rating: {
		average: row.averageRating,
		count: row.reviewCount,
	},
	sales: {
		revenueCents: row.revenueCents,
		currency: row.course.currency,
	},
});

const shapeCourseDetails = (
	row: Awaited<ReturnType<ReturnType<typeof selectCourseOverviewRows>["limit"]>>[number],
	ratingDistribution: ReturnType<typeof createEmptyRatingDistribution>,
) => ({
	...row.course,
	teacher: row.teacher,
	category: row.category?.id ? row.category : null,
	thumbnail: nullableAsset(row.thumbnail),
	counts: {
		sections: row.sectionCount,
		lessons: row.lessonCount,
		videoLessons: row.videoLessonCount,
		textLessons: row.textLessonCount,
		quizLessons: row.quizLessonCount,
		previewLessons: row.previewLessonCount,
		totalDurationSeconds: row.totalDurationSeconds,
		quizQuestions: row.quizQuestionCount,
		quizOptions: row.quizOptionCount,
		enrollments: row.enrollmentCount,
		activeEnrollments: row.activeEnrollmentCount,
		completedEnrollments: row.completedEnrollmentCount,
		refundedEnrollments: row.refundedEnrollmentCount,
		revokedEnrollments: row.revokedEnrollmentCount,
		reviews: row.reviewCount,
		wishlists: row.wishlistCount,
		purchases: row.purchaseCount,
	},
	rating: {
		average: row.averageRating,
		count: row.reviewCount,
		distribution: ratingDistribution,
	},
	sales: {
		revenueCents: row.revenueCents,
		purchaseCount: row.purchaseCount,
		currency: row.course.currency,
	},
});

const assertCourseExists = async (courseId: string) => {
	const [existingCourse] = await db
		.select({ id: course.id })
		.from(course)
		.where(eq(course.id, courseId));

	if (!existingCourse) {
		throw notFoundError("Course not found");
	}
};

const assertUpdateReferencesExist = async (input: UpdateCourseBody) => {
	if (input.categoryId) {
		const [category] = await db
			.select({ id: courseCategory.id })
			.from(courseCategory)
			.where(eq(courseCategory.id, input.categoryId));

		if (!category) {
			throw notFoundError("Course category not found");
		}
	}

	if (input.thumbnailAssetId) {
		const [asset] = await db
			.select({ id: mediaAsset.id })
			.from(mediaAsset)
			.where(eq(mediaAsset.id, input.thumbnailAssetId));

		if (!asset) {
			throw notFoundError("Thumbnail asset not found");
		}
	}
};

const getCourseRatingDistribution = async (courseId: string) => {
	const distribution = createEmptyRatingDistribution();

	const rows = await db
		.select({
			rating: courseReview.rating,
			count: count(courseReview.id),
		})
		.from(courseReview)
		.where(eq(courseReview.courseId, courseId))
		.groupBy(courseReview.rating);

	for (const row of rows) {
		if (row.rating >= 1 && row.rating <= 5) {
			distribution[row.rating as 1 | 2 | 3 | 4 | 5] = row.count;
		}
	}

	return distribution;
};

export const listCoursesService = async (query: ListCoursesQuery) => {
	const { limit, offset } = getCoursePagination(query);
	const where = getCourseFilters(query);
	const sortBy = query.sortBy ?? "createdAt";
	const sortDirection = query.sortDirection ?? "desc";

	const [totalRow] = await db
		.select({ value: countDistinct(course.id) })
		.from(course)
		.innerJoin(teacherProfile, eq(course.teacherProfileId, teacherProfile.id))
		.innerJoin(user, eq(teacherProfile.userId, user.id))
		.leftJoin(courseCategory, eq(course.categoryId, courseCategory.id))
		.where(where);

	const rows = await selectCourseOverviewRows()
		.where(where)
		.orderBy(getCourseSort(courseStatColumns, sortBy, sortDirection))
		.limit(limit)
		.offset(offset);

	const items = rows.map(shapeCourseOverview);

	return {
		filters: getCourseFilterValues(query),
		sorting: {
			sortBy,
			sortDirection,
		},
		pagination: getCoursePaginationMeta({
			count: totalRow.value,
			limit,
			offset,
		}),
		items,
	};
};

export const getCourseDetailsService = async (courseId: string) => {
	const [row] = await selectCourseOverviewRows().where(eq(course.id, courseId));

	if (!row) {
		throw notFoundError("Course not found");
	}

	const ratingDistribution = await getCourseRatingDistribution(courseId);

	return shapeCourseDetails(row, ratingDistribution);
};

export const updateCourseService = async (
	courseId: string,
	input: UpdateCourseBody,
) => {
	await assertUpdateReferencesExist(input);

	try {
		const [updatedCourse] = await db
			.update(course)
			.set(input)
			.where(eq(course.id, courseId))
			.returning({ id: course.id });

		if (!updatedCourse) {
			throw notFoundError("Course not found");
		}

		return getCourseDetailsService(updatedCourse.id);
	} catch (error) {
		if (isUniqueConstraintError(error)) {
			throw conflictError("Course slug already exists");
		}

		if (isForeignKeyConstraintError(error)) {
			throw notFoundError("Course reference not found");
		}

		throw error;
	}
};

export const updateCourseStatusService = async (
	courseId: string,
	input: UpdateCourseStatusBody,
) => {
	const now = new Date();
	const statusFields =
		input.status === "published"
			? {
					status: input.status,
					publishedAt: sql<Date>`coalesce(${course.publishedAt}, ${now})`,
					archivedAt: null,
				}
			: input.status === "archived"
				? { status: input.status, archivedAt: now }
				: { status: input.status, archivedAt: null };

	const [updatedCourse] = await db
		.update(course)
		.set(statusFields)
		.where(eq(course.id, courseId))
		.returning({
			id: course.id,
			status: course.status,
			publishedAt: course.publishedAt,
			archivedAt: course.archivedAt,
			updatedAt: course.updatedAt,
		});

	if (!updatedCourse) {
		throw notFoundError("Course not found");
	}

	return updatedCourse;
};

export const getCourseCurriculumService = async (courseId: string) => {
	const [courseRecord] = await db
		.select({
			id: course.id,
			title: course.title,
			slug: course.slug,
			status: course.status,
		})
		.from(course)
		.where(eq(course.id, courseId));

	if (!courseRecord) {
		throw notFoundError("Course not found");
	}

	const sections = await db
		.select({
			id: courseSection.id,
			title: courseSection.title,
			description: courseSection.description,
			position: courseSection.position,
			createdAt: courseSection.createdAt,
			updatedAt: courseSection.updatedAt,
		})
		.from(courseSection)
		.where(eq(courseSection.courseId, courseId))
		.orderBy(courseSection.position, courseSection.createdAt);

	const sectionIds = sections.map((section) => section.id);

	const lessons =
		sectionIds.length > 0
			? await db
					.select({
						id: lesson.id,
						sectionId: lesson.sectionId,
						title: lesson.title,
						description: lesson.description,
						type: lesson.type,
						textContent: lesson.textContent,
						durationSeconds: lesson.durationSeconds,
						position: lesson.position,
						isPreview: lesson.isPreview,
						createdAt: lesson.createdAt,
						updatedAt: lesson.updatedAt,
						videoAsset: {
							id: mediaAsset.id,
							url: mediaAsset.url,
							mimeType: mediaAsset.mimeType,
							sizeBytes: mediaAsset.sizeBytes,
						},
					})
					.from(lesson)
					.leftJoin(mediaAsset, eq(lesson.videoAssetId, mediaAsset.id))
					.where(inArray(lesson.sectionId, sectionIds))
					.orderBy(lesson.position, lesson.createdAt)
			: [];

	const lessonIds = lessons.map((lessonRecord) => lessonRecord.id);

	const questions =
		lessonIds.length > 0
			? await db
					.select({
						id: quizQuestion.id,
						lessonId: quizQuestion.lessonId,
						prompt: quizQuestion.prompt,
						explanation: quizQuestion.explanation,
						position: quizQuestion.position,
						createdAt: quizQuestion.createdAt,
						updatedAt: quizQuestion.updatedAt,
					})
					.from(quizQuestion)
					.where(inArray(quizQuestion.lessonId, lessonIds))
					.orderBy(quizQuestion.position, quizQuestion.createdAt)
			: [];

	const questionIds = questions.map((question) => question.id);

	const options =
		questionIds.length > 0
			? await db
					.select({
						id: quizOption.id,
						questionId: quizOption.questionId,
						text: quizOption.text,
						isCorrect: quizOption.isCorrect,
						position: quizOption.position,
						createdAt: quizOption.createdAt,
						updatedAt: quizOption.updatedAt,
					})
					.from(quizOption)
					.where(inArray(quizOption.questionId, questionIds))
					.orderBy(quizOption.position, quizOption.createdAt)
			: [];

	return {
		course: courseRecord,
		summary: {
			sections: sections.length,
			lessons: lessons.length,
			videoLessons: lessons.filter((item) => item.type === "video").length,
			textLessons: lessons.filter((item) => item.type === "text").length,
			quizLessons: lessons.filter((item) => item.type === "quiz").length,
			previewLessons: lessons.filter((item) => item.isPreview).length,
			totalDurationSeconds: lessons.reduce(
				(total, item) => total + (item.durationSeconds ?? 0),
				0,
			),
			quizQuestions: questions.length,
			quizOptions: options.length,
		},
		sections: buildCourseCurriculum({
			sections,
			lessons,
			questions,
			options,
		}),
	};
};

export const getCoursePerformanceService = async (
	courseId: string,
	query: CoursePerformanceQuery,
) => {
	await assertCourseExists(courseId);

	const [courseRecord] = await db
		.select({
			id: course.id,
			title: course.title,
			slug: course.slug,
			status: course.status,
			priceCents: course.priceCents,
			currency: course.currency,
		})
		.from(course)
		.where(eq(course.id, courseId));

	const enrollmentFilters = [
		eq(enrollment.courseId, courseId),
		...getCourseDateFilters(enrollment.enrolledAt, query),
	];
	const purchaseFilters = [
		eq(purchaseOrderItem.courseId, courseId),
		...getCourseDateFilters(purchaseOrderItem.createdAt, query),
	];
	const reviewFilters = [
		eq(courseReview.courseId, courseId),
		...getCourseDateFilters(courseReview.createdAt, query),
	];
	const wishlistFilters = [
		eq(wishlistItem.courseId, courseId),
		...getCourseDateFilters(wishlistItem.createdAt, query),
	];

	const [enrollmentStats] = await db
		.select({
			total: count(enrollment.id),
			active:
				sql<number>`count(${enrollment.id}) filter (where ${enrollment.status} = 'active')::int`,
			completed:
				sql<number>`count(${enrollment.id}) filter (where ${enrollment.status} = 'completed')::int`,
			refunded:
				sql<number>`count(${enrollment.id}) filter (where ${enrollment.status} = 'refunded')::int`,
			revoked:
				sql<number>`count(${enrollment.id}) filter (where ${enrollment.status} = 'revoked')::int`,
		})
		.from(enrollment)
		.where(and(...enrollmentFilters));

	const [salesStats] = await db
		.select({
			purchaseCount: count(purchaseOrderItem.id),
			revenueCents:
				sql<number>`coalesce(sum(${purchaseOrderItem.priceCents}), 0)::int`,
		})
		.from(purchaseOrderItem)
		.where(and(...purchaseFilters));

	const [reviewStats] = await db
		.select({
			count: count(courseReview.id),
			averageRating:
				sql<number>`coalesce(avg(${courseReview.rating}), 0)::float8`,
		})
		.from(courseReview)
		.where(and(...reviewFilters));

	const ratingDistribution = createEmptyRatingDistribution();
	const ratingDistributionRows = await db
		.select({
			rating: courseReview.rating,
			count: count(courseReview.id),
		})
		.from(courseReview)
		.where(and(...reviewFilters))
		.groupBy(courseReview.rating);

	for (const row of ratingDistributionRows) {
		if (row.rating >= 1 && row.rating <= 5) {
			ratingDistribution[row.rating as 1 | 2 | 3 | 4 | 5] = row.count;
		}
	}

	const [wishlistStats] = await db
		.select({
			count: count(wishlistItem.id),
		})
		.from(wishlistItem)
		.where(and(...wishlistFilters));

	return {
		filters: getCoursePerformanceFilterValues(query),
		course: courseRecord,
		sales: {
			purchaseCount: salesStats.purchaseCount,
			revenueCents: salesStats.revenueCents,
			currency: courseRecord.currency,
		},
		enrollments: {
			total: enrollmentStats.total,
			active: enrollmentStats.active,
			completed: enrollmentStats.completed,
			refunded: enrollmentStats.refunded,
			revoked: enrollmentStats.revoked,
			completionRate: calculateCompletionRate({
				completed: enrollmentStats.completed,
				total: enrollmentStats.total,
			}),
		},
		reviews: {
			count: reviewStats.count,
			averageRating: reviewStats.averageRating,
			distribution: ratingDistribution,
		},
		wishlist: {
			count: wishlistStats.count,
		},
	};
};
