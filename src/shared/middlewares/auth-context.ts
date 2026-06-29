import { eq } from "drizzle-orm";
import type { Context } from "hono";
import { createMiddleware } from "hono/factory";
import { db } from "../../db/db.js";
import { studentProfile, teacherProfile } from "../../db/schemas/schema.js";
import { env } from "../constants/env.js";
import { forbiddenError, unauthorizedError } from "../constants/errors.js";
import { auth } from "../utils/auth.js";

type AuthUser = typeof auth.$Infer.Session.user;
type AuthSession = typeof auth.$Infer.Session.session;

export type CurrentAuthContext = {
	isAuthenticated: boolean;
	userId: string | null;
	accountRole: string | null;
	accountRoles: string[];
	isAdmin: boolean;
	isStudent: boolean;
	isTeacher: boolean;
	studentProfileId: string | null;
	teacherProfileId: string | null;
};

declare module "hono" {
	interface ContextVariableMap {
		user: AuthUser | null;
		session: AuthSession | null;
		authContext: CurrentAuthContext;
	}
}

const anonymousAuthContext: CurrentAuthContext = {
	isAuthenticated: false,
	userId: null,
	accountRole: null,
	accountRoles: [],
	isAdmin: false,
	isStudent: false,
	studentProfileId: null,
	isTeacher: false,
	teacherProfileId: null,
};

const parseAccountRoles = (role: unknown) => {
	if (typeof role !== "string") {
		return [];
	}

	return role
		.split(",")
		.map((item) => item.trim().toLowerCase())
		.filter(Boolean);
};

const getUserRole = (user: AuthUser) => {
	return "role" in user && typeof user.role === "string" ? user.role : null;
};

const isAdminUser = (user: AuthUser, accountRoles: string[]) => {
	const isAdminRole = accountRoles.includes("admin");
	const isAdminUserId =
		env.ADMIN_USER_ID !== undefined && user.id === env.ADMIN_USER_ID;
	const isAdminEmail =
		env.ADMIN_EMAIL !== undefined &&
		user.email.trim().toLowerCase() === env.ADMIN_EMAIL;

	return isAdminRole || isAdminUserId || isAdminEmail;
};

export const attachAuthContext = createMiddleware(async (c, next) => {
	const authSession = await auth.api.getSession({
		headers: c.req.raw.headers,
	});

	if (!authSession) {
		c.set("user", null);
		c.set("session", null);
		c.set("authContext", anonymousAuthContext);
		await next();
		return;
	}

	const [student, teacher] = await Promise.all([
		db
			.select({ id: studentProfile.id })
			.from(studentProfile)
			.where(eq(studentProfile.userId, authSession.user.id))
			.limit(1),
		db
			.select({ id: teacherProfile.id })
			.from(teacherProfile)
			.where(eq(teacherProfile.userId, authSession.user.id))
			.limit(1),
	]);

	const accountRole = getUserRole(authSession.user);
	const accountRoles = parseAccountRoles(accountRole);

	c.set("user", authSession.user);
	c.set("session", authSession.session);
	c.set("authContext", {
		isAuthenticated: true,
		userId: authSession.user.id,
		accountRole,
		accountRoles,
		isAdmin: isAdminUser(authSession.user, accountRoles),
		isStudent: student[0] !== undefined,
		studentProfileId: student[0]?.id ?? null,
		isTeacher: teacher[0] !== undefined,
		teacherProfileId: teacher[0]?.id ?? null,
	});

	await next();
});

const getAuthContext = (c: Context) => {
	return c.get("authContext") ?? anonymousAuthContext;
};

export const requireAuth = createMiddleware(async (c, next) => {
	const currentAuth = getAuthContext(c);

	if (!currentAuth.isAuthenticated) {
		throw unauthorizedError("You must be signed in");
	}

	await next();
});

export const requireAdmin = createMiddleware(async (c, next) => {
	const currentAuth = getAuthContext(c);

	if (!currentAuth.isAuthenticated) {
		throw unauthorizedError("You must be signed in");
	}

	if (!currentAuth.isAdmin) {
		throw forbiddenError("Admin access is required");
	}

	await next();
});

export const requireTeacher = createMiddleware(async (c, next) => {
	const currentAuth = getAuthContext(c);

	if (!currentAuth.isAuthenticated) {
		throw unauthorizedError("You must be signed in");
	}

	if (!currentAuth.isTeacher) {
		throw forbiddenError("Teacher profile is required");
	}

	await next();
});

export const requireStudent = createMiddleware(async (c, next) => {
	const currentAuth = getAuthContext(c);

	if (!currentAuth.isAuthenticated) {
		throw unauthorizedError("You must be signed in");
	}

	if (!currentAuth.isStudent) {
		throw forbiddenError("Student profile is required");
	}

	await next();
});

export const requireTeacherOrAdmin = createMiddleware(async (c, next) => {
	const currentAuth = getAuthContext(c);

	if (!currentAuth.isAuthenticated) {
		throw unauthorizedError("You must be signed in");
	}

	if (!currentAuth.isTeacher && !currentAuth.isAdmin) {
		throw forbiddenError("Teacher or admin access is required");
	}

	await next();
});
