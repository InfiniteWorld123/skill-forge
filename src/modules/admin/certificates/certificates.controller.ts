import { createFactory } from "hono/factory";
import { jsonOk } from "../../../shared/utils/json-response.js";
import {
	getCertificateDetailsSkeleton,
	listCertificatesSkeleton,
	verifyCertificateSkeleton,
} from "./certificates.service.js";

const factory = createFactory();

// Business: admin can see issued certificates.
export const listCertificates = factory.createHandlers(async (c) => {
	return jsonOk({
		c,
		message: "List certificates skeleton",
		data: listCertificatesSkeleton(),
	});
});

// Business: admin can verify a certificate code.
export const verifyCertificate = factory.createHandlers(async (c) => {
	return jsonOk({
		c,
		message: "Verify certificate skeleton",
		data: verifyCertificateSkeleton(),
	});
});

// Business: admin can inspect one certificate.
export const getCertificateDetails = factory.createHandlers(async (c) => {
	return jsonOk({
		c,
		message: "Certificate details skeleton",
		data: getCertificateDetailsSkeleton(),
	});
});
