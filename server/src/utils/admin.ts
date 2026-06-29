import { env } from "../constants/env.js";

export const isAdminEmail = (email: string | null | undefined) => {
	if (email === null || email === undefined || env.ADMIN_EMAIL === undefined) {
		return false;
	}

	return email.trim().toLowerCase() === env.ADMIN_EMAIL;
};
