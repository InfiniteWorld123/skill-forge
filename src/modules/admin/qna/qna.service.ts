import { count, eq, sql } from "drizzle-orm";
import { db } from "../../../db/db.js";
import {
	course,
	courseSection,
	lesson,
	lessonAnswer,
	lessonQuestion,
	user,
} from "../../../db/schemas/schema.js";
import { notFoundError } from "../../../shared/constants/errors.js";
import type {
	ListQuestionsQuery,
	UpdateQuestionStatusBody,
} from "./qna.validation.js";
import {
	createBodyPreview,
	getListQuestionsSort,
	getPagination,
	getPaginationMeta,
	getQuestionFilterValues,
	getQuestionFilters,
} from "./qna.utils.js";

const getAnswerStatsSubquery = () => {
	return db
		.select({
			questionId: lessonAnswer.questionId,
			answerCount: count(lessonAnswer.id).as("answer_count"),
			firstAnswerAt: sql<Date | null>`min(${lessonAnswer.createdAt})`.as(
				"first_answer_at",
			),
			latestAnswerAt: sql<Date | null>`max(${lessonAnswer.createdAt})`.as(
				"latest_answer_at",
			),
		})
		.from(lessonAnswer)
		.groupBy(lessonAnswer.questionId)
		.as("answer_stats");
};

export const listQuestionsService = async (query: ListQuestionsQuery) => {
	const { limit, offset } = getPagination(query);
	const answerStats = getAnswerStatsSubquery();
	const answerCount = sql<number>`coalesce(${answerStats.answerCount}, 0)::int`;
	const latestActivityAt = sql<Date>`greatest(
		${lessonQuestion.createdAt},
		coalesce(${answerStats.latestAnswerAt}, ${lessonQuestion.createdAt})
	)`;
	const where = getQuestionFilters(query, latestActivityAt);

	const [totalRow] = await db
		.select({ value: count() })
		.from(lessonQuestion)
		.innerJoin(user, eq(lessonQuestion.userId, user.id))
		.innerJoin(lesson, eq(lessonQuestion.lessonId, lesson.id))
		.innerJoin(courseSection, eq(lesson.sectionId, courseSection.id))
		.innerJoin(course, eq(courseSection.courseId, course.id))
		.leftJoin(answerStats, eq(answerStats.questionId, lessonQuestion.id))
		.where(where);

	const rows = await db
		.select({
			id: lessonQuestion.id,
			title: lessonQuestion.title,
			body: lessonQuestion.body,
			status: lessonQuestion.status,
			acceptedAnswerId: lessonQuestion.acceptedAnswerId,
			createdAt: lessonQuestion.createdAt,
			updatedAt: lessonQuestion.updatedAt,
			answerCount,
			firstAnswerAt: answerStats.firstAnswerAt,
			latestAnswerAt: answerStats.latestAnswerAt,
			latestActivityAt,
			student: {
				id: user.id,
				name: user.name,
				email: user.email,
				image: user.image,
			},
			lesson: {
				id: lesson.id,
				title: lesson.title,
				position: lesson.position,
			},
			section: {
				id: courseSection.id,
				title: courseSection.title,
				position: courseSection.position,
			},
			course: {
				id: course.id,
				title: course.title,
				slug: course.slug,
				status: course.status,
			},
		})
		.from(lessonQuestion)
		.innerJoin(user, eq(lessonQuestion.userId, user.id))
		.innerJoin(lesson, eq(lessonQuestion.lessonId, lesson.id))
		.innerJoin(courseSection, eq(lesson.sectionId, courseSection.id))
		.innerJoin(course, eq(courseSection.courseId, course.id))
		.leftJoin(answerStats, eq(answerStats.questionId, lessonQuestion.id))
		.where(where)
		.orderBy(
			getListQuestionsSort(
				query.sortBy,
				query.sortDirection,
				latestActivityAt,
				answerCount,
			),
		)
		.limit(limit)
		.offset(offset);

	const items = rows.map(({ body, ...row }) => ({
		...row,
		bodyPreview: createBodyPreview(body),
	}));

	return {
		filters: {
			...getQuestionFilterValues(query),
			limit,
			offset,
			sortBy: query.sortBy ?? "latestActivityAt",
			sortDirection: query.sortDirection ?? "desc",
		},
		pagination: getPaginationMeta({
			total: totalRow.value,
			limit,
			offset,
			itemCount: items.length,
		}),
		items,
	};
};

export const getQuestionDetailsService = async (questionId: string) => {
	const [details] = await db
		.select({
			question: {
				id: lessonQuestion.id,
				lessonId: lessonQuestion.lessonId,
				userId: lessonQuestion.userId,
				acceptedAnswerId: lessonQuestion.acceptedAnswerId,
				status: lessonQuestion.status,
				title: lessonQuestion.title,
				body: lessonQuestion.body,
				createdAt: lessonQuestion.createdAt,
				updatedAt: lessonQuestion.updatedAt,
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
			lesson: {
				id: lesson.id,
				title: lesson.title,
				description: lesson.description,
				type: lesson.type,
				position: lesson.position,
				durationSeconds: lesson.durationSeconds,
				isPreview: lesson.isPreview,
			},
			section: {
				id: courseSection.id,
				title: courseSection.title,
				description: courseSection.description,
				position: courseSection.position,
			},
			course: {
				id: course.id,
				title: course.title,
				slug: course.slug,
				status: course.status,
				level: course.level,
				language: course.language,
				publishedAt: course.publishedAt,
				archivedAt: course.archivedAt,
			},
		})
		.from(lessonQuestion)
		.innerJoin(user, eq(lessonQuestion.userId, user.id))
		.innerJoin(lesson, eq(lessonQuestion.lessonId, lesson.id))
		.innerJoin(courseSection, eq(lesson.sectionId, courseSection.id))
		.innerJoin(course, eq(courseSection.courseId, course.id))
		.where(eq(lessonQuestion.id, questionId));

	if (!details) {
		throw notFoundError("Question not found");
	}

	const answers = await db
		.select({
			id: lessonAnswer.id,
			body: lessonAnswer.body,
			createdAt: lessonAnswer.createdAt,
			updatedAt: lessonAnswer.updatedAt,
			author: {
				id: user.id,
				name: user.name,
				email: user.email,
				image: user.image,
				role: user.role,
			},
		})
		.from(lessonAnswer)
		.innerJoin(user, eq(lessonAnswer.userId, user.id))
		.where(eq(lessonAnswer.questionId, questionId))
		.orderBy(lessonAnswer.createdAt);

	const answersWithAcceptedFlag = answers.map((answer) => ({
		...answer,
		isAccepted: answer.id === details.question.acceptedAnswerId,
	}));

	const acceptedAnswer =
		answersWithAcceptedFlag.find((answer) => answer.isAccepted) ?? null;
	const firstAnswerAt = answersWithAcceptedFlag[0]?.createdAt ?? null;
	const latestAnswerAt =
		answersWithAcceptedFlag[answersWithAcceptedFlag.length - 1]?.createdAt ??
		null;

	return {
		...details,
		answers: answersWithAcceptedFlag,
		acceptedAnswer,
		adminInfo: {
			answerCount: answersWithAcceptedFlag.length,
			firstAnswerAt,
			latestAnswerAt,
			latestActivityAt: latestAnswerAt ?? details.question.createdAt,
		},
	};
};

export const updateQuestionStatusService = async (
	questionId: string,
	input: UpdateQuestionStatusBody,
) => {
	const [existingQuestion] = await db
		.select({
			id: lessonQuestion.id,
			status: lessonQuestion.status,
		})
		.from(lessonQuestion)
		.where(eq(lessonQuestion.id, questionId));

	if (!existingQuestion) {
		throw notFoundError("Question not found");
	}

	const [updatedQuestion] = await db
		.update(lessonQuestion)
		.set({ status: input.status })
		.where(eq(lessonQuestion.id, questionId))
		.returning({
			id: lessonQuestion.id,
			status: lessonQuestion.status,
			updatedAt: lessonQuestion.updatedAt,
		});

	return {
		...updatedQuestion,
		previousStatus: existingQuestion.status,
	};
};
