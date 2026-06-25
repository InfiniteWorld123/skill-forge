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
	DATABASE_URL: getEnvVar("DATABASE_URL"),
} as const;

export type EnvVariables = typeof env;