import { Hono } from "hono";
import {
	requestResetPassword,
	resetPassword,
	sendVerificationOtp,
	signIn,
	signOut,
	signUp,
	verifyEmail,
} from "./auth.controller.js";

const authRoute = new Hono()
	.post("/sign-up", ...signUp)
	.post("/sign-in", ...signIn)
	.post("/sign-out", ...signOut)
	.post("/send-verification-otp", ...sendVerificationOtp)
	.post("/verify-email", ...verifyEmail)
	.post("/forgot-password", ...requestResetPassword)
	.post("/reset-password", ...resetPassword);

export type AppType = typeof authRoute;
export default authRoute;
