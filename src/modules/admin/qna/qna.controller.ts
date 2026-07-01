import { sValidator } from "@hono/standard-validator";
import { createFactory } from "hono/factory";
import { jsonOk } from "../../../shared/utils/json-response.js";
import {
	getQuestionDetailsService,
	listQuestionsService,
	updateQuestionStatusService,
} from "./qna.service.js";
import { validationError } from "./qna.utils.js";
import {
	listQuestionsQuerySchema,
	questionIdParamsSchema,
	updateQuestionStatusBodySchema,
} from "./qna.validation.js";

const factory = createFactory();

// Business: admin can see student questions.
export const listQuestions = factory.createHandlers(
	sValidator("query", listQuestionsQuerySchema, (result, c) => {
		if (!result.success) return validationError(result, c);
	}),
	async (c) => {
		const data = await listQuestionsService(c.req.valid("query"));

		return jsonOk({
			c,
			message: "Lesson questions",
			data,
		});
	},
);

// Business: admin can inspect one question and its answers.
export const getQuestionDetails = factory.createHandlers(
	sValidator("param", questionIdParamsSchema, (result, c) => {
		if (!result.success) return validationError(result, c);
	}),
	async (c) => {
		const { questionId } = c.req.valid("param");
		const data = await getQuestionDetailsService(questionId);

		return jsonOk({
			c,
			message: "Question details",
			data,
		});
	},
);

// Business: admin can change a question status.
export const updateQuestionStatus = factory.createHandlers(
	sValidator("param", questionIdParamsSchema, (result, c) => {
		if (!result.success) return validationError(result, c);
	}),
	sValidator("json", updateQuestionStatusBodySchema, (result, c) => {
		if (!result.success) return validationError(result, c);
	}),
	async (c) => {
		const { questionId } = c.req.valid("param");
		const data = await updateQuestionStatusService(
			questionId,
			c.req.valid("json"),
		);

		return jsonOk({
			c,
			message: "Question status updated",
			data,
		});
	},
);
