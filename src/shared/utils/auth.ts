import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, emailOTP } from "better-auth/plugins";
import { env } from "../constants/env.js";
import { db } from "../../db/db.js";
import * as schema from "../../db/schemas/schema.js";
import {
	resetPasswordEmailTemplate,
	verifyEmailTemplate,
	welcomeEmailTemplate,
} from "./email-templates.js";
import { sendEmail } from "./mailer.js";

export const auth = betterAuth({
	baseURL: env.BETTER_AUTH_URL,
	secret: env.BETTER_AUTH_SECRET,
	trustedOrigins: [env.BETTER_AUTH_URL],
	database: drizzleAdapter(db, {
		provider: "pg",
		schema,
	}),
	databaseHooks: {
		user: {
			create: {
				before: async (user) => {
					const isSeedAdmin =
						env.ADMIN_EMAIL !== undefined &&
						user.email.trim().toLowerCase() === env.ADMIN_EMAIL;

					return {
						data: {
							role: isSeedAdmin ? "admin" : "user",
						},
					};
				},
				after: async (user) => {
					await db.insert(schema.studentProfile).values({ userId: user.id });

					await sendEmail({
						to: user.email,
						subject: "Welcome to Skill Forge",
						html: welcomeEmailTemplate({
							name: user.name,
							url: env.BETTER_AUTH_URL,
						}),
					});
				},
			},
		},
	},
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: true,
		onPasswordReset: async ({ user }) => {
			console.info("[auth] password reset completed", {
				email: user.email,
				userId: user.id,
			});
		},
	},
	socialProviders: {
		github: {
			clientId: process.env.GITHUB_CLIENT_ID as string,
			clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
		},
	},
	plugins: [
		admin({
			adminRoles: ["admin"],
			adminUserIds: env.ADMIN_USER_ID ? [env.ADMIN_USER_ID] : undefined,
			defaultRole: "user",
			impersonationSessionDuration: 60 * 60,
		}),
		emailOTP({
			expiresIn: 300,
			otpLength: 6,
			allowedAttempts: 3,
			resendStrategy: "reuse",
			async sendVerificationOTP({ email, otp, type }) {
				if (type === "email-verification") {
					await sendEmail({
						to: email,
						subject: "Verify your Skill Forge email",
						html: verifyEmailTemplate({ otp }),
					});
					return;
				}

				if (type === "forget-password") {
					await sendEmail({
						to: email,
						subject: "Reset your Skill Forge password",
						html: resetPasswordEmailTemplate({ otp }),
					});
				}
			},
		}),
	],
});
