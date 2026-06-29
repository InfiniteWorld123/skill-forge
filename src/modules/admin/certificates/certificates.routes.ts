import { Hono } from "hono";
import {
	getCertificateDetails,
	listCertificates,
	verifyCertificate,
} from "./certificates.controller.js";

const certificatesRoute = new Hono()
	// Business: admin sees all issued certificates.
	.get("/", ...listCertificates)
	// Business: admin verifies a certificate code.
	.get("/verify/:certificateCode", ...verifyCertificate)
	// Business: admin sees one certificate.
	.get("/:certificateId", ...getCertificateDetails);

export default certificatesRoute;
