import { createAdminEndpointSkeleton } from "../admin.service.js";

export const listQuestionsSkeleton = () => {
	return createAdminEndpointSkeleton({
		area: "Q&A",
		api: "List questions",
		method: "GET",
		path: "/admin/qna/questions",
		businessMeaning:
			"Admin sees student questions and can check if teachers are helping.",
		dataSource: ["lesson_question", "lesson", "course_section", "course", "user"],
		futureLogic: [
			"Return questions with student, lesson, course, status, and answer count.",
			"Support filters by status, course, user, and date.",
		],
	});
};

export const getQuestionDetailsSkeleton = () => {
	return createAdminEndpointSkeleton({
		area: "Q&A",
		api: "Question details",
		method: "GET",
		path: "/admin/qna/questions/:questionId",
		businessMeaning:
			"Admin sees one question, its lesson, course, student, and answers.",
		dataSource: [
			"lesson_question",
			"lesson_answer",
			"lesson",
			"course_section",
			"course",
			"user",
		],
		futureLogic: [
			"Load one question with all answers.",
			"Show if the question has an accepted answer.",
		],
	});
};

export const updateQuestionStatusSkeleton = () => {
	return createAdminEndpointSkeleton({
		area: "Q&A",
		api: "Update question status",
		method: "PATCH",
		path: "/admin/qna/questions/:questionId/status",
		businessMeaning:
			"Admin can mark a question as open, answered, or closed.",
		dataSource: ["lesson_question"],
		futureLogic: [
			"Validate question status.",
			"Update lesson_question.status.",
		],
	});
};
