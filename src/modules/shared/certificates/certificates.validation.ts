import * as v from "valibot";

const trimmedString = v.pipe(v.string(), v.trim());

export const verifyCertificateParamsSchema = v.object({
	certificateCode: v.pipe(
		trimmedString,
		v.minLength(1, "Certificate code is required"),
	),
});

export type VerifyCertificateParams = v.InferOutput<
	typeof verifyCertificateParamsSchema
>;
