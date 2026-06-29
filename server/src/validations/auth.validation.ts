import * as v from "valibot";

const emailValidation = v.pipe(
	v.string(),
	v.trim(),
	v.toLowerCase(),
	v.email("Please enter a valid email address"),
);

const passwordValidation = v.pipe(
	v.string(),
	v.minLength(12, "Password must be at least 12 characters long"),
	v.regex(/[A-Z]/, "Password must contain at least one uppercase letter"),
	v.regex(/[0-9]/, "Password must contain at least one number"),
	v.regex(
		/[^A-Za-z0-9]/,
		"Password must contain at least one special character",
	),
);

const callbackURLValidation = v.optional(
	v.pipe(v.string(), v.url("Callback URL must be a valid URL")),
);

const otpValidation = v.pipe(
	v.string(),
	v.trim(),
	v.regex(/^\d{6}$/, "Verification code must be 6 digits"),
);

const otpTypeValidation = v.union([
	v.literal("email-verification"),
	v.literal("forget-password"),
]);

export const signUpSchema = v.pipe(
	v.object({
		name: v.pipe(
			v.string(),
			v.minLength(3, "Name must be at least 3 characters long"),
			v.trim(),
		),
		email: emailValidation,
		password: passwordValidation,
		confirmPassword: v.string(),
		image: v.optional(v.pipe(v.string(), v.url("Image must be a valid URL"))),
		callbackURL: callbackURLValidation,
	}),
	v.forward(
		v.partialCheck(
			[["password"], ["confirmPassword"]],
			(input) => input.password === input.confirmPassword,
			"Passwords do not match",
		),
		["confirmPassword"],
	),
);

export const signInSchema = v.object({
	email: emailValidation,
	password: v.pipe(v.string(), v.minLength(1, "Password is required")),
	rememberMe: v.optional(v.boolean()),
	callbackURL: callbackURLValidation,
});

export const emailSchema = v.object({
	email: emailValidation,
});

export const requestResetPasswordSchema = emailSchema;

export const sendVerificationOtpSchema = v.object({
	email: emailValidation,
	type: v.optional(otpTypeValidation),
});

export const verifyEmailSchema = v.object({
	email: emailValidation,
	otp: otpValidation,
});

export const resetPasswordSchema = v.pipe(
	v.object({
		email: emailValidation,
		otp: otpValidation,
		newPassword: passwordValidation,
		confirmPassword: v.string(),
	}),
	v.forward(
		v.partialCheck(
			[["newPassword"], ["confirmPassword"]],
			(input) => input.newPassword === input.confirmPassword,
			"Passwords do not match",
		),
		["confirmPassword"],
	),
);
