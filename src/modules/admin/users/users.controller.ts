import { createFactory } from "hono/factory";
import { jsonOk } from "../../../shared/utils/json-response.js";
import {
	getUserActivitySkeleton,
	getUserDetailsSkeleton,
	listUsersSkeleton,
} from "./users.service.js";

const factory = createFactory();

// Business: admin can find and understand platform users.
export const listUsers = factory.createHandlers(async (c) => {
	return jsonOk({ c, message: "List users skeleton", data: listUsersSkeleton() });
});

// Business: admin can inspect one user for support or review.
export const getUserDetails = factory.createHandlers(async (c) => {
	return jsonOk({
		c,
		message: "User details skeleton",
		data: getUserDetailsSkeleton(),
	});
});

// Business: admin can see what one user has done recently.
export const getUserActivity = factory.createHandlers(async (c) => {
	return jsonOk({
		c,
		message: "User activity skeleton",
		data: getUserActivitySkeleton(),
	});
});
