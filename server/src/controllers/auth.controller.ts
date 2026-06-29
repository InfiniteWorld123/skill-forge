import { createFactory } from "hono/factory";
import { sValidator } from "@hono/standard-validator";
import { auth } from "../utils/auth.js";
import { jsonOk } from "../utils/json-response.js";
import {
	requestResetPasswordSchema,
	resetPasswordSchema,
	sendVerificationOtpSchema,
	signInSchema,
	signUpSchema,
	verifyEmailSchema,
} from "../validations/auth.validation.js";

const factory = createFactory();

export const signUp = factory.createHandlers(
	sValidator("json", signUpSchema, (result, c) => {
		if (!result.success) {
			return c.json({ success: false, errors: result.error }, 400);
		}
	}),
	async (c) => {
		const { name, email, password, image, callbackURL } = c.req.valid("json");

		const data = await auth.api.signUpEmail({
			body: { name, email, password, image, callbackURL },
		});

		await auth.api.sendVerificationOTP({
			body: { email, type: "email-verification" },
		});

		return jsonOk({ c, data, message: "Account created successfully" });
	},
);

export const signIn = factory.createHandlers(
	sValidator("json", signInSchema, (result, c) => {
		if (!result.success) {
			return c.json({ success: false, errors: result.error }, 400);
		}
	}),
	async (c) => {
		const { email, password, rememberMe, callbackURL } = c.req.valid("json");

		const data = await auth.api.signInEmail({
			body: { email, password, rememberMe, callbackURL },
		});

		return jsonOk({ c, data, message: "Signed in successfully" });
	},
);

export const signOut = factory.createHandlers(async (c) => {
	const data = await auth.api.signOut({ headers: c.req.raw.headers });
	return jsonOk({ c, data, message: "Signed out successfully" });
});

export const sendVerificationOtp = factory.createHandlers(
	sValidator("json", sendVerificationOtpSchema, (result, c) => {
		if (!result.success) {
			return c.json({ success: false, errors: result.error }, 400);
		}
	}),
	async (c) => {
		const { email, type = "email-verification" } = c.req.valid("json");

		const data = await auth.api.sendVerificationOTP({
			body: { email, type },
		});

		return jsonOk({ c, data, message: "Verification code sent" });
	},
);

export const verifyEmail = factory.createHandlers(
	sValidator("json", verifyEmailSchema, (result, c) => {
		if (!result.success) {
			return c.json({ success: false, errors: result.error }, 400);
		}
	}),
	async (c) => {
		const { email, otp } = c.req.valid("json");

		const data = await auth.api.verifyEmailOTP({ body: { email, otp } });

		return jsonOk({ c, data, message: "Email verified successfully" });
	},
);

export const requestResetPassword = factory.createHandlers(
	sValidator("json", requestResetPasswordSchema, (result, c) => {
		if (!result.success) {
			return c.json({ success: false, errors: result.error }, 400);
		}
	}),
	async (c) => {
		const { email } = c.req.valid("json");

		const data = await auth.api.requestPasswordResetEmailOTP({
			body: { email },
		});

		return jsonOk({ c, data, message: "Password reset code sent" });
	},
);

export const resetPassword = factory.createHandlers(
	sValidator("json", resetPasswordSchema, (result, c) => {
		if (!result.success) {
			return c.json({ success: false, errors: result.error }, 400);
		}
	}),
	async (c) => {
		const { email, otp, newPassword } = c.req.valid("json");

		const data = await auth.api.resetPasswordEmailOTP({
			body: { email, otp, password: newPassword },
		});

		return jsonOk({ c, data, message: "Password reset successfully" });
	},
);
