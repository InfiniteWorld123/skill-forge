import { auth } from "../../../shared/utils/auth.js";
import type {
	BanAuthUserInput,
	CreateAuthUserInput,
	HasAccountPermissionInput,
	ListAuthUsersQuery,
	SetAuthUserPasswordInput,
	SetAuthUserRoleInput,
	UpdateAuthUserInput,
} from "./accounts.validation.js";

const removeUndefinedValues = <T extends Record<string, unknown>>(input: T) => {
	return Object.fromEntries(
		Object.entries(input).filter(([, value]) => value !== undefined),
	);
};

export const listAccountRolesService = () => {
	return {
		businessMeaning:
			"Admin can understand which account roles exist in the platform.",
		roles: [
			{
				name: "admin",
				businessMeaning:
					"Can manage auth users, roles, bans, impersonation, and sessions.",
			},
			{
				name: "user",
				businessMeaning:
					"Normal platform account. Can learn and can also become a teacher through teacher_profile.",
			},
		],
	};
};

export const listAuthUsersService = async (
	headers: Headers,
	query: ListAuthUsersQuery,
) => {
	return auth.api.listUsers({
		headers,
		query: removeUndefinedValues(query),
	});
};

export const getAuthUserService = async (headers: Headers, userId: string) => {
	return auth.api.getUser({
		headers,
		query: { id: userId },
	});
};

export const createAuthUserService = async (
	headers: Headers,
	body: CreateAuthUserInput,
) => {
	return auth.api.createUser({
		headers,
		body: {
			email: body.email,
			name: body.name,
			password: body.password,
			role: body.role,
		},
	});
};

export const updateAuthUserService = async (
	headers: Headers,
	userId: string,
	body: UpdateAuthUserInput,
) => {
	return auth.api.adminUpdateUser({
		headers,
		body: {
			userId,
			data: removeUndefinedValues(body),
		},
	});
};

export const removeAuthUserService = async (headers: Headers, userId: string) => {
	return auth.api.removeUser({
		headers,
		body: { userId },
	});
};

export const setAuthUserRoleService = async (
	headers: Headers,
	userId: string,
	body: SetAuthUserRoleInput,
) => {
	return auth.api.setRole({
		headers,
		body: {
			userId,
			role: body.role,
		},
	});
};

export const banAuthUserService = async (
	headers: Headers,
	userId: string,
	body: BanAuthUserInput,
) => {
	return auth.api.banUser({
		headers,
		body: {
			userId,
			...removeUndefinedValues(body),
		},
	});
};

export const unbanAuthUserService = async (headers: Headers, userId: string) => {
	return auth.api.unbanUser({
		headers,
		body: { userId },
	});
};

export const impersonateAuthUserService = async (
	headers: Headers,
	userId: string,
) => {
	return auth.api.impersonateUser({
		headers,
		body: { userId },
		asResponse: true,
	});
};

export const stopImpersonatingAuthUserService = async (headers: Headers) => {
	return auth.api.stopImpersonating({
		headers,
		asResponse: true,
	});
};

export const listAuthUserSessionsService = async (
	headers: Headers,
	userId: string,
) => {
	return auth.api.listUserSessions({
		headers,
		body: { userId },
	});
};

export const revokeAuthUserSessionService = async (
	headers: Headers,
	sessionToken: string,
) => {
	return auth.api.revokeUserSession({
		headers,
		body: { sessionToken },
	});
};

export const revokeAllAuthUserSessionsService = async (
	headers: Headers,
	userId: string,
) => {
	return auth.api.revokeUserSessions({
		headers,
		body: { userId },
	});
};

export const setAuthUserPasswordService = async (
	headers: Headers,
	userId: string,
	body: SetAuthUserPasswordInput,
) => {
	return auth.api.setUserPassword({
		headers,
		body: {
			userId,
			newPassword: body.newPassword,
		},
	});
};

export const hasAccountPermissionService = async (
	headers: Headers,
	body: HasAccountPermissionInput,
) => {
	return auth.api.userHasPermission({
		headers,
		body: {
			userId: body.userId,
			role: body.role,
			permissions: body.permissions,
		},
	});
};
