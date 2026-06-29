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

export const env = {
	BETTER_AUTH_SECRET: getEnvVar("BETTER_AUTH_SECRET"),
	BETTER_AUTH_URL: getEnvVar("BETTER_AUTH_URL"),
	DATABASE_URL: getEnvVar("DATABASE_URL"),
	EMAIL_FROM:
		getOptionalEnvVar("EMAIL_FROM") ??
		"Skill Forge No Reply <skill-forge@yamanwarda.dev>",
	RESEND: getEnvVar("RESEND"),
} as const;

export type EnvVariables = typeof env;
