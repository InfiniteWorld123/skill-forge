import { sValidator } from "@hono/standard-validator";
import type { Context } from "hono";
import { createFactory } from "hono/factory";
import { jsonOk } from "../../../shared/utils/json-response.js";
import {
	banAuthUserService,
	createAuthUserService,
	getAuthUserService,
	hasAccountPermissionService,
	impersonateAuthUserService,
	listAccountRolesService,
	listAuthUserSessionsService,
	listAuthUsersService,
	removeAuthUserService,
	revokeAllAuthUserSessionsService,
	revokeAuthUserSessionService,
	setAuthUserPasswordService,
	setAuthUserRoleService,
	stopImpersonatingAuthUserService,
	unbanAuthUserService,
	updateAuthUserService,
} from "./accounts.service.js";
import {
	authUserIdParamsSchema,
	banAuthUserSchema,
	createAuthUserSchema,
	hasAccountPermissionSchema,
	listAuthUsersQuerySchema,
	revokeAuthUserSessionSchema,
	setAuthUserPasswordSchema,
	setAuthUserRoleSchema,
	updateAuthUserSchema,
} from "./accounts.validation.js";

const factory = createFactory();

const validationError = (
	result: { success: false; error: unknown },
	c: Context,
) => {
	return c.json({ success: false, errors: result.error }, 400);
};

// Business: admin sees which account roles exist and what they mean.
export const listAccountRoles = factory.createHandlers(async (c) => {
	return jsonOk({
		c,
		message: "Account roles",
		data: listAccountRolesService(),
	});
});

// Business: admin can list auth accounts using Better Auth Admin.
export const listAuthUsers = factory.createHandlers(
	sValidator("query", listAuthUsersQuerySchema, (result, c) => {
		if (!result.success) return validationError(result, c);
	}),
	async (c) => {
		const data = await listAuthUsersService(
			c.req.raw.headers,
			c.req.valid("query"),
		);

		return jsonOk({ c, message: "Auth users", data });
	},
);

// Business: admin can inspect one auth account.
export const getAuthUser = factory.createHandlers(
	sValidator("param", authUserIdParamsSchema, (result, c) => {
		if (!result.success) return validationError(result, c);
	}),
	async (c) => {
		const { userId } = c.req.valid("param");
		const data = await getAuthUserService(c.req.raw.headers, userId);

		return jsonOk({ c, message: "Auth user details", data });
	},
);

// Business: admin can create a new auth account.
export const createAuthUser = factory.createHandlers(
	sValidator("json", createAuthUserSchema, (result, c) => {
		if (!result.success) return validationError(result, c);
	}),
	async (c) => {
		const data = await createAuthUserService(
			c.req.raw.headers,
			c.req.valid("json"),
		);

		return jsonOk({ c, message: "Auth user created", data });
	},
);

// Business: admin can update basic auth account fields.
export const updateAuthUser = factory.createHandlers(
	sValidator("param", authUserIdParamsSchema, (result, c) => {
		if (!result.success) return validationError(result, c);
	}),
	sValidator("json", updateAuthUserSchema, (result, c) => {
		if (!result.success) return validationError(result, c);
	}),
	async (c) => {
		const { userId } = c.req.valid("param");
		const data = await updateAuthUserService(
			c.req.raw.headers,
			userId,
			c.req.valid("json"),
		);

		return jsonOk({ c, message: "Auth user updated", data });
	},
);

// Business: admin can permanently remove an auth account.
export const removeAuthUser = factory.createHandlers(
	sValidator("param", authUserIdParamsSchema, (result, c) => {
		if (!result.success) return validationError(result, c);
	}),
	async (c) => {
		const { userId } = c.req.valid("param");
		const data = await removeAuthUserService(c.req.raw.headers, userId);

		return jsonOk({ c, message: "Auth user removed", data });
	},
);

// Business: admin can set a user account role.
export const setAuthUserRole = factory.createHandlers(
	sValidator("param", authUserIdParamsSchema, (result, c) => {
		if (!result.success) return validationError(result, c);
	}),
	sValidator("json", setAuthUserRoleSchema, (result, c) => {
		if (!result.success) return validationError(result, c);
	}),
	async (c) => {
		const { userId } = c.req.valid("param");
		const data = await setAuthUserRoleService(
			c.req.raw.headers,
			userId,
			c.req.valid("json"),
		);

		return jsonOk({ c, message: "Auth user role updated", data });
	},
);

// Business: admin can block a user from signing in.
export const banAuthUser = factory.createHandlers(
	sValidator("param", authUserIdParamsSchema, (result, c) => {
		if (!result.success) return validationError(result, c);
	}),
	sValidator("json", banAuthUserSchema, (result, c) => {
		if (!result.success) return validationError(result, c);
	}),
	async (c) => {
		const { userId } = c.req.valid("param");
		const data = await banAuthUserService(
			c.req.raw.headers,
			userId,
			c.req.valid("json"),
		);

		return jsonOk({ c, message: "Auth user banned", data });
	},
);

// Business: admin can allow a banned user to sign in again.
export const unbanAuthUser = factory.createHandlers(
	sValidator("param", authUserIdParamsSchema, (result, c) => {
		if (!result.success) return validationError(result, c);
	}),
	async (c) => {
		const { userId } = c.req.valid("param");
		const data = await unbanAuthUserService(c.req.raw.headers, userId);

		return jsonOk({ c, message: "Auth user unbanned", data });
	},
);

// Business: admin can temporarily enter another user account for support.
export const impersonateAuthUser = factory.createHandlers(
	sValidator("param", authUserIdParamsSchema, (result, c) => {
		if (!result.success) return validationError(result, c);
	}),
	async (c) => {
		const { userId } = c.req.valid("param");
		return impersonateAuthUserService(c.req.raw.headers, userId);
	},
);

// Business: admin can return from impersonation back to their own account.
export const stopImpersonatingAuthUser = factory.createHandlers(async (c) => {
	return stopImpersonatingAuthUserService(c.req.raw.headers);
});

// Business: admin can see all sessions for one user.
export const listAuthUserSessions = factory.createHandlers(
	sValidator("param", authUserIdParamsSchema, (result, c) => {
		if (!result.success) return validationError(result, c);
	}),
	async (c) => {
		const { userId } = c.req.valid("param");
		const data = await listAuthUserSessionsService(c.req.raw.headers, userId);

		return jsonOk({ c, message: "Auth user sessions", data });
	},
);

// Business: admin can revoke one session by token.
export const revokeAuthUserSession = factory.createHandlers(
	sValidator("json", revokeAuthUserSessionSchema, (result, c) => {
		if (!result.success) return validationError(result, c);
	}),
	async (c) => {
		const { sessionToken } = c.req.valid("json");
		const data = await revokeAuthUserSessionService(
			c.req.raw.headers,
			sessionToken,
		);

		return jsonOk({ c, message: "Auth user session revoked", data });
	},
);

// Business: admin can revoke all sessions for one user.
export const revokeAllAuthUserSessions = factory.createHandlers(
	sValidator("param", authUserIdParamsSchema, (result, c) => {
		if (!result.success) return validationError(result, c);
	}),
	async (c) => {
		const { userId } = c.req.valid("param");
		const data = await revokeAllAuthUserSessionsService(
			c.req.raw.headers,
			userId,
		);

		return jsonOk({ c, message: "All auth user sessions revoked", data });
	},
);

// Business: admin can set a new password for a user.
export const setAuthUserPassword = factory.createHandlers(
	sValidator("param", authUserIdParamsSchema, (result, c) => {
		if (!result.success) return validationError(result, c);
	}),
	sValidator("json", setAuthUserPasswordSchema, (result, c) => {
		if (!result.success) return validationError(result, c);
	}),
	async (c) => {
		const { userId } = c.req.valid("param");
		const data = await setAuthUserPasswordService(
			c.req.raw.headers,
			userId,
			c.req.valid("json"),
		);

		return jsonOk({ c, message: "Auth user password updated", data });
	},
);

// Business: admin can check if a user or role has a permission.
export const hasAccountPermission = factory.createHandlers(
	sValidator("json", hasAccountPermissionSchema, (result, c) => {
		if (!result.success) return validationError(result, c);
	}),
	async (c) => {
		const data = await hasAccountPermissionService(
			c.req.raw.headers,
			c.req.valid("json"),
		);

		return jsonOk({ c, message: "Account permission check", data });
	},
);
