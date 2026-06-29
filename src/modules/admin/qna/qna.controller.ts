import { createFactory } from "hono/factory";
import { jsonOk } from "../../../shared/utils/json-response.js";
import {
	getQuestionDetailsSkeleton,
	listQuestionsSkeleton,
	updateQuestionStatusSkeleton,
} from "./qna.service.js";

const factory = createFactory();

// Business: admin can see student questions.
export const listQuestions = factory.createHandlers(async (c) => {
	return jsonOk({
		c,
		message: "List questions skeleton",
		data: listQuestionsSkeleton(),
	});
});

// Business: admin can inspect one question and its answers.
export const getQuestionDetails = factory.createHandlers(async (c) => {
	return jsonOk({
		c,
		message: "Question details skeleton",
		data: getQuestionDetailsSkeleton(),
	});
});

// Business: admin can change a question status.
export const updateQuestionStatus = factory.createHandlers(async (c) => {
	return jsonOk({
		c,
		message: "Update question status skeleton",
		data: updateQuestionStatusSkeleton(),
	});
});
