import { Hono } from "hono";
import { verifyCertificate } from "./certificates.controller.js";

const certificatesRoute = new Hono().get(
	"/verify/:certificateCode",
	...verifyCertificate,
);

export default certificatesRoute;
