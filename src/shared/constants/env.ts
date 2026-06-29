const getEnvVar = (key: string) => {
	const value = process.env[key];
	if (value === undefined || value.trim() === "") {
		throw new Error(`Environment variable ${key} is missing`);
	}
	return value;
};

const getOptionalEnvVar = (key: string) => {
	const value = process.env[key];
	if (value === undefined || value.trim() === "") {
		return undefined;
	}
	return value;
};

const getOptionalNumberEnvVar = (key: string, fallback: number) => {
	const value = getOptionalEnvVar(key);
	if (value === undefined) {
		return fallback;
	}

	const parsed = Number(value);
	if (!Number.isFinite(parsed)) {
		throw new Error(`Environment variable ${key} must be a number`);
	}

	return parsed;
};

export const env = {
	ADMIN_EMAIL: getOptionalEnvVar("ADMIN_EMAIL")?.toLowerCase(),
	ADMIN_USER_ID: getOptionalEnvVar("ADMIN_USER_ID"),
	BETTER_AUTH_SECRET: getEnvVar("BETTER_AUTH_SECRET"),
	BETTER_AUTH_URL: getEnvVar("BETTER_AUTH_URL"),
	DATABASE_URL: getEnvVar("DATABASE_URL"),
	EMAIL_FROM:
		getOptionalEnvVar("EMAIL_FROM") ??
		"Skill Forge No Reply <skill-forge@yamanwarda.dev>",
	PLATFORM_COMMISSION_PERCENT: getOptionalNumberEnvVar(
		"PLATFORM_COMMISSION_PERCENT",
		20,
	),
	RESEND: getEnvVar("RESEND"),
} as const;

export type EnvVariables = typeof env;
