import * as v from "valibot";

const trimmedString = v.pipe(v.string(), v.trim());

const userIdValidation = v.pipe(
	trimmedString,
	v.minLength(1, "User id is required"),
);

const sessionTokenValidation = v.pipe(
	trimmedString,
	v.minLength(1, "Session token is required"),
);

const emailValidation = v.pipe(
	trimmedString,
	v.toLowerCase(),
	v.email("Please enter a valid email address"),
);

const passwordValidation = v.pipe(
	v.string(),
	v.minLength(12, "Password must be at least 12 characters long"),
);

const roleValidation = v.union([v.literal("admin"), v.literal("user")]);

const accountUserPermissionValidation = v.union([
	v.literal("create"),
	v.literal("list"),
	v.literal("set-role"),
	v.literal("ban"),
	v.literal("impersonate"),
	v.literal("impersonate-admins"),
	v.literal("delete"),
	v.literal("set-password"),
	v.literal("set-email"),
	v.literal("get"),
	v.literal("update"),
]);

const accountSessionPermissionValidation = v.union([
	v.literal("list"),
	v.literal("revoke"),
	v.literal("delete"),
]);

export const authUserIdParamsSchema = v.object({
	userId: userIdValidation,
});

export const listAuthUsersQuerySchema = v.object({
	searchValue: v.optional(trimmedString),
	searchField: v.optional(v.union([v.literal("email"), v.literal("name")])),
	searchOperator: v.optional(
		v.union([
			v.literal("contains"),
			v.literal("starts_with"),
			v.literal("ends_with"),
		]),
	),
	limit: v.optional(v.pipe(trimmedString, v.regex(/^\d+$/, "Limit must be a number"))),
	offset: v.optional(
		v.pipe(trimmedString, v.regex(/^\d+$/, "Offset must be a number")),
	),
	sortBy: v.optional(trimmedString),
	sortDirection: v.optional(v.union([v.literal("asc"), v.literal("desc")])),
	filterField: v.optional(trimmedString),
	filterValue: v.optional(trimmedString),
	filterOperator: v.optional(trimmedString),
});

export const createAuthUserSchema = v.object({
	name: v.pipe(trimmedString, v.minLength(1, "Name is required")),
	email: emailValidation,
	password: v.optional(passwordValidation),
	role: v.optional(roleValidation),
});

export const updateAuthUserSchema = v.partial(
	v.object({
		name: v.pipe(trimmedString, v.minLength(1, "Name cannot be empty")),
		email: emailValidation,
		emailVerified: v.boolean(),
		image: v.nullable(v.pipe(trimmedString, v.url("Image must be a valid URL"))),
	}),
);

export const setAuthUserRoleSchema = v.object({
	role: roleValidation,
});

export const banAuthUserSchema = v.object({
	banReason: v.optional(trimmedString),
	banExpiresIn: v.optional(
		v.pipe(
			v.number(),
			v.integer("Ban expiration must be a whole number of seconds"),
			v.minValue(1, "Ban expiration must be at least 1 second"),
		),
	),
});

export const revokeAuthUserSessionSchema = v.object({
	sessionToken: sessionTokenValidation,
});

export const setAuthUserPasswordSchema = v.object({
	newPassword: passwordValidation,
});

export const hasAccountPermissionSchema = v.object({
	userId: v.optional(userIdValidation),
	role: v.optional(roleValidation),
	permissions: v.object({
		user: v.optional(v.array(accountUserPermissionValidation)),
		session: v.optional(v.array(accountSessionPermissionValidation)),
	}),
});

export type ListAuthUsersQuery = v.InferOutput<typeof listAuthUsersQuerySchema>;
export type CreateAuthUserInput = v.InferOutput<typeof createAuthUserSchema>;
export type UpdateAuthUserInput = v.InferOutput<typeof updateAuthUserSchema>;
export type SetAuthUserRoleInput = v.InferOutput<typeof setAuthUserRoleSchema>;
export type BanAuthUserInput = v.InferOutput<typeof banAuthUserSchema>;
export type RevokeAuthUserSessionInput = v.InferOutput<
	typeof revokeAuthUserSessionSchema
>;
export type SetAuthUserPasswordInput = v.InferOutput<
	typeof setAuthUserPasswordSchema
>;
export type HasAccountPermissionInput = v.InferOutput<
	typeof hasAccountPermissionSchema
>;
