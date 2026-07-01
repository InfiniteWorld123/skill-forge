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
import type { Context } from "hono";
import {
	course,
	enrollment,
	purchaseOrderItem,
	user,
} from "../../../db/schemas/schema.js";
import type { ListEnrollmentsQuery } from "./enrollments.validation.js";

export const validationError = (
	result: { success: false; error: unknown },
	c: Context,
) => {
	return c.json({ success: false, errors: result.error }, 400);
};

export const getPagination = (query: ListEnrollmentsQuery) => {
	return {
		limit: query.limit ? Number(query.limit) : 20,
		offset: query.offset ? Number(query.offset) : 0,
	};
};

export const getPaginationMeta = ({
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
		total,
		limit,
		offset,
		hasNext: offset + itemCount < total,
		hasPrev: offset > 0,
	};
};

export const getDateRange = (query: ListEnrollmentsQuery) => {
	const from = query.from ? new Date(query.from) : undefined;
	const to = query.to ? new Date(query.to) : undefined;

	if (from) from.setHours(0, 0, 0, 0);
	if (to) to.setHours(23, 59, 59, 999);

	return { from, to };
};

export const getEnrollmentFilters = (query: ListEnrollmentsQuery) => {
	const filters: SQLWrapper[] = [];
	const { from, to } = getDateRange(query);

	if (query.search) {
		const search = `%${query.search}%`;
		const searchFilter = or(
			ilike(user.name, search),
			ilike(user.email, search),
			ilike(course.title, search),
			ilike(course.slug, search),
			ilike(sql<string>`${enrollment.id}::text`, search),
			ilike(sql<string>`${purchaseOrderItem.id}::text`, search),
			ilike(sql<string>`${purchaseOrderItem.orderId}::text`, search),
			ilike(purchaseOrderItem.titleSnapshot, search),
		);

		if (searchFilter) filters.push(searchFilter);
	}

	if (query.status) filters.push(eq(enrollment.status, query.status));
	if (query.courseId) filters.push(eq(enrollment.courseId, query.courseId));
	if (query.userId) filters.push(eq(enrollment.userId, query.userId));
	if (from) filters.push(gte(enrollment.enrolledAt, from));
	if (to) filters.push(lte(enrollment.enrolledAt, to));

	return filters.length > 0 ? and(...filters) : undefined;
};

export const getEnrollmentSort = (
	sortBy: ListEnrollmentsQuery["sortBy"] = "enrolledAt",
	sortDirection: ListEnrollmentsQuery["sortDirection"] = "desc",
) => {
	const columns = {
		enrolledAt: enrollment.enrolledAt,
		completedAt: enrollment.completedAt,
		updatedAt: enrollment.updatedAt,
		status: enrollment.status,
		studentName: user.name,
		courseTitle: course.title,
	};

	const column = columns[sortBy];

	return sortDirection === "asc" ? asc(column) : desc(column);
};

export const getProgressPercent = (
	completedLessons: number,
	totalLessons: number,
) => {
	if (totalLessons <= 0) return 0;

	return Math.round((completedLessons / totalLessons) * 100);
};

type ProgressLessonRow = {
	sectionId: string;
	sectionTitle: string;
	sectionPosition: number;
	lessonId: string | null;
	lessonTitle: string | null;
	lessonType: "video" | "text" | "quiz" | null;
	lessonPosition: number | null;
	lessonDurationSeconds: number | null;
	completedAt: Date | null;
};

export const buildProgressDetails = (rows: ProgressLessonRow[]) => {
	const sections = new Map<
		string,
		{
			id: string;
			title: string;
			position: number;
			lessons: {
				id: string;
				title: string;
				type: "video" | "text" | "quiz";
				position: number;
				durationSeconds: number | null;
				completedAt: Date | null;
			}[];
		}
	>();

	let totalLessons = 0;
	let completedLessons = 0;
	let lastCompletedAt: Date | null = null;

	for (const row of rows) {
		const section = sections.get(row.sectionId) ?? {
			id: row.sectionId,
			title: row.sectionTitle,
			position: row.sectionPosition,
			lessons: [],
		};

		if (!sections.has(row.sectionId)) {
			sections.set(row.sectionId, section);
		}

		if (!row.lessonId || !row.lessonTitle || !row.lessonType) continue;

		totalLessons += 1;

		if (row.completedAt) {
			completedLessons += 1;

			if (!lastCompletedAt || row.completedAt > lastCompletedAt) {
				lastCompletedAt = row.completedAt;
			}
		}

		section.lessons.push({
			id: row.lessonId,
			title: row.lessonTitle,
			type: row.lessonType,
			position: row.lessonPosition ?? 0,
			durationSeconds: row.lessonDurationSeconds,
			completedAt: row.completedAt,
		});
	}

	return {
		totalLessons,
		completedLessons,
		percent: getProgressPercent(completedLessons, totalLessons),
		lastCompletedAt,
		sections: Array.from(sections.values()),
	};
};

export const getCompletedAtForStatusUpdate = ({
	status,
	completedAt,
}: {
	status: "active" | "completed" | "refunded" | "revoked";
	completedAt?: string | null;
}) => {
	if (status !== "completed") return null;

	return completedAt ? new Date(completedAt) : new Date();
};
