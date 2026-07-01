import { sValidator } from "@hono/standard-validator";
import { createFactory } from "hono/factory";
import { jsonOk } from "../../../shared/utils/json-response.js";
import {
	getUserActivityService,
	getUserDetailsService,
	listUsersService,
} from "./users.service.js";
import { validationError } from "./users.utils.js";
import {
	getUserActivityParamsSchema,
	getUserActivityQuerySchema,
	getUserDetailsParamsSchema,
	listUsersQuerySchema,
} from "./users.validation.js";

const factory = createFactory();

// Business: admin can find and understand platform users.
export const listUsers = factory.createHandlers(
	sValidator("query", listUsersQuerySchema, (result, c) => {
		if (!result.success) return validationError(result, c);
	}),
	async (c) => {
		const data = await listUsersService(c.req.valid("query"));

		return jsonOk({ c, message: "Users", data });
	},
);

// Business: admin can inspect one user for support or review.
export const getUserDetails = factory.createHandlers(
	sValidator("param", getUserDetailsParamsSchema, (result, c) => {
		if (!result.success) return validationError(result, c);
	}),
	async (c) => {
		const { userId } = c.req.valid("param");
		const data = await getUserDetailsService(userId);

		return jsonOk({
			c,
			message: "User details",
			data,
		});
	},
);

// Business: admin can see what one user has done recently.
export const getUserActivity = factory.createHandlers(
	sValidator("param", getUserActivityParamsSchema, (result, c) => {
		if (!result.success) return validationError(result, c);
	}),
	sValidator("query", getUserActivityQuerySchema, (result, c) => {
		if (!result.success) return validationError(result, c);
	}),
	async (c) => {
		const { userId } = c.req.valid("param");
		const data = await getUserActivityService(userId, c.req.valid("query"));

		return jsonOk({
			c,
			message: "User activity",
			data,
		});
	},
);
