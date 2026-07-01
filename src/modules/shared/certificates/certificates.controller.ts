import { sValidator } from "@hono/standard-validator";
import type { Context } from "hono";
import { createFactory } from "hono/factory";
import { jsonOk } from "../../../shared/utils/json-response.js";
import { verifySharedCertificateService } from "./certificates.service.js";
import { verifyCertificateParamsSchema } from "./certificates.validation.js";

const factory = createFactory();

const validationError = (
	result: { success: false; error: unknown },
	c: Context,
) => {
	return c.json({ success: false, errors: result.error }, 400);
};

// Business: anyone can verify that a certificate code is real.
export const verifyCertificate = factory.createHandlers(
	sValidator("param", verifyCertificateParamsSchema, (result, c) => {
		if (!result.success) return validationError(result, c);
	}),
	async (c) => {
		const { certificateCode } = c.req.valid("param");
		const data = await verifySharedCertificateService(certificateCode);

		return jsonOk({
			c,
			message: "Certificate verification",
			data,
		});
	},
);
