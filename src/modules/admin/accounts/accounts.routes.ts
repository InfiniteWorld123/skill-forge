import { Hono } from "hono";
import {
	banAuthUser,
	createAuthUser,
	getAuthUser,
	hasAccountPermission,
	impersonateAuthUser,
	listAccountRoles,
	listAuthUserSessions,
	listAuthUsers,
	removeAuthUser,
	revokeAllAuthUserSessions,
	revokeAuthUserSession,
	setAuthUserPassword,
	setAuthUserRole,
	stopImpersonatingAuthUser,
	unbanAuthUser,
	updateAuthUser,
} from "./accounts.controller.js";

const accountsRoute = new Hono()
	// Business: admin sees account roles available in Better Auth.
	.get("/roles", ...listAccountRoles)
	// Business: admin checks whether a user or role has a permission.
	.post("/has-permission", ...hasAccountPermission)
	// Business: admin revokes one session by session token.
	.post("/sessions/revoke", ...revokeAuthUserSession)
	// Business: admin stops impersonating and returns to their own account.
	.post("/stop-impersonating", ...stopImpersonatingAuthUser)
	// Business: admin lists auth users.
	.get("/", ...listAuthUsers)
	// Business: admin creates an auth user.
	.post("/", ...createAuthUser)
	// Business: admin reads one auth user.
	.get("/:userId", ...getAuthUser)
	// Business: admin updates basic auth user fields.
	.patch("/:userId", ...updateAuthUser)
	// Business: admin deletes an auth user.
	.delete("/:userId", ...removeAuthUser)
	// Business: admin sets admin/user role.
	.patch("/:userId/role", ...setAuthUserRole)
	// Business: admin bans a user from signing in.
	.post("/:userId/ban", ...banAuthUser)
	// Business: admin removes a user ban.
	.post("/:userId/unban", ...unbanAuthUser)
	// Business: admin impersonates a user for support.
	.post("/:userId/impersonate", ...impersonateAuthUser)
	// Business: admin sees all sessions for a user.
	.get("/:userId/sessions", ...listAuthUserSessions)
	// Business: admin revokes all sessions for a user.
	.post("/:userId/sessions/revoke", ...revokeAllAuthUserSessions)
	// Business: admin sets a user password.
	.patch("/:userId/password", ...setAuthUserPassword);

export default accountsRoute;
