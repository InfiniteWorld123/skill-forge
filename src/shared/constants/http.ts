export const HttpStatusCode = {
	OK: 200,
	CREATED: 201,
	ACCEPTED: 202,
	NO_CONTENT: 204,
	BAD_REQUEST: 400,
	UNAUTHORIZED: 401,
	FORBIDDEN: 403,
	CONFLICT: 409,
	NOT_FOUND: 404,
	UNPROCESSABLE_ENTITY: 422,
	INTERNAL_SERVER_ERROR: 500,
	SERVICE_UNAVAILABLE: 503,
} as const;

export type HttpStatusCode =
	(typeof HttpStatusCode)[keyof typeof HttpStatusCode];

export const HTTP_STATUS_MESSAGES: Record<HttpStatusCode, string> = {
	[HttpStatusCode.OK]: "OK",
	[HttpStatusCode.CREATED]: "Created",
	[HttpStatusCode.ACCEPTED]: "Accepted",
	[HttpStatusCode.NO_CONTENT]: "No Content",
	[HttpStatusCode.BAD_REQUEST]: "Bad Request",
	[HttpStatusCode.UNAUTHORIZED]: "Unauthorized",
	[HttpStatusCode.FORBIDDEN]: "Forbidden",
	[HttpStatusCode.CONFLICT]: "Conflict",
	[HttpStatusCode.NOT_FOUND]: "Not Found",
	[HttpStatusCode.UNPROCESSABLE_ENTITY]: "Unprocessable Entity",
	[HttpStatusCode.INTERNAL_SERVER_ERROR]: "Internal Server Error",
	[HttpStatusCode.SERVICE_UNAVAILABLE]: "Service Unavailable",
} as const;