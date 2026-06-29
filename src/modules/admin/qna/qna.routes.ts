import { Hono } from "hono";
import {
	getQuestionDetails,
	listQuestions,
	updateQuestionStatus,
} from "./qna.controller.js";

const qnaRoute = new Hono()
	// Business: admin sees all student questions.
	.get("/questions", ...listQuestions)
	// Business: admin sees one question with answers.
	.get("/questions/:questionId", ...getQuestionDetails)
	// Business: admin changes question status.
	.patch("/questions/:questionId/status", ...updateQuestionStatus);

export default qnaRoute;
