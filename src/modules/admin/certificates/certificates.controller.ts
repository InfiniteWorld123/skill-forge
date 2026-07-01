import { sValidator } from "@hono/standard-validator";
import { createFactory } from "hono/factory";
import { jsonOk } from "../../../shared/utils/json-response.js";
import {
	getCertificateDetailsService,
	listCertificatesService,
	verifyCertificateService,
} from "./certificates.service.js";
import { validationError } from "./certificates.utils.js";
import {
	getCertificateDetailsParamsSchema,
	listCertificatesQuerySchema,
	verifyCertificateParamsSchema,
} from "./certificates.validation.js";

const factory = createFactory();

// Business: admin can see issued certificates.
export const listCertificates = factory.createHandlers(
	sValidator("query", listCertificatesQuerySchema, (result, c) => {
		if (!result.success) return validationError(result, c);
	}),
	async (c) => {
		const data = await listCertificatesService(c.req.valid("query"));

		return jsonOk({
			c,
			message: "Certificates",
			data,
		});
	},
);

// Business: admin can verify a certificate code.
export const verifyCertificate = factory.createHandlers(
	sValidator("param", verifyCertificateParamsSchema, (result, c) => {
		if (!result.success) return validationError(result, c);
	}),
	async (c) => {
		const { certificateCode } = c.req.valid("param");
		const data = await verifyCertificateService(certificateCode);

		return jsonOk({
			c,
			message: "Certificate verification",
			data,
		});
	},
);

// Business: admin can inspect one certificate.
export const getCertificateDetails = factory.createHandlers(
	sValidator("param", getCertificateDetailsParamsSchema, (result, c) => {
		if (!result.success) return validationError(result, c);
	}),
	async (c) => {
		const { certificateId } = c.req.valid("param");
		const data = await getCertificateDetailsService(certificateId);

		return jsonOk({
			c,
			message: "Certificate details",
			data,
		});
	},
);
