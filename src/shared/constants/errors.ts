import {
	HttpStatusCode,
	type HttpStatusCode as HttpStatusCodeType,
} from "./http.js";

export type AppErrorCode =
	| "UNAUTHORIZED"
	| "FORBIDDEN"
	| "NOT_FOUND"
	| "CONFLICT"
	| "VALIDATION_ERROR"
	| "BAD_REQUEST"
	| "INTERNAL_ERROR";

type AppErrorOptions = {
	status: HttpStatusCodeType;
	code: AppErrorCode;
	message: string;
	details?: unknown;
};

export class AppError extends Error {
	readonly status: HttpStatusCodeType;
	readonly code: AppErrorCode;
	readonly details?: unknown;

	constructor({ status, code, message, details }: AppErrorOptions) {
		super(message);
		this.name = "AppError";
		this.status = status;
		this.code = code;
		this.details = details;
	}
}

export const isAppError = (error: unknown): error is AppError => {
	return error instanceof AppError;
};

export const unauthorizedError = (
	message = "Unauthorized",
	details?: unknown,
): AppError => {
	return new AppError({
		status: HttpStatusCode.UNAUTHORIZED,
		code: "UNAUTHORIZED",
		message,
		details,
	});
};

export const forbiddenError = (
	message = "Forbidden",
	details?: unknown,
): AppError => {
	return new AppError({
		status: HttpStatusCode.FORBIDDEN,
		code: "FORBIDDEN",
		message,
		details,
	});
};

export const notFoundError = (
	message = "Resource not found",
	details?: unknown,
): AppError => {
	return new AppError({
		status: HttpStatusCode.NOT_FOUND,
		code: "NOT_FOUND",
		message,
		details,
	});
};

export const conflictError = (
	message = "Conflict",
	details?: unknown,
): AppError => {
	return new AppError({
		status: HttpStatusCode.CONFLICT,
		code: "CONFLICT",
		message,
		details,
	});
};

export const validationError = (
	message = "Validation failed",
	details?: unknown,
): AppError => {
	return new AppError({
		status: HttpStatusCode.UNPROCESSABLE_ENTITY,
		code: "VALIDATION_ERROR",
		message,
		details,
	});
};

export const badRequestError = (
	message = "Bad request",
	details?: unknown,
): AppError => {
	return new AppError({
		status: HttpStatusCode.BAD_REQUEST,
		code: "BAD_REQUEST",
		message,
		details,
	});
};

export const internalError = (
	message = "Internal server error",
	details?: unknown,
): AppError => {
	return new AppError({
		status: HttpStatusCode.INTERNAL_SERVER_ERROR,
		code: "INTERNAL_ERROR",
		message,
		details,
	});
};
