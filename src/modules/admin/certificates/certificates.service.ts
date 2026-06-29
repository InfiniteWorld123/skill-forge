import { createAdminEndpointSkeleton } from "../admin.service.js";

export const listCertificatesSkeleton = () => {
	return createAdminEndpointSkeleton({
		area: "Certificates",
		api: "List certificates",
		method: "GET",
		path: "/admin/certificates",
		businessMeaning:
			"Admin sees certificates issued to students after course completion.",
		dataSource: ["certificate", "user", "course", "enrollment"],
		futureLogic: [
			"Return certificates with student, course, certificate code, and issued date.",
			"Support filters by course, user, and date.",
		],
	});
};

export const verifyCertificateSkeleton = () => {
	return createAdminEndpointSkeleton({
		area: "Certificates",
		api: "Verify certificate",
		method: "GET",
		path: "/admin/certificates/verify/:certificateCode",
		businessMeaning:
			"Admin verifies that a certificate code is real.",
		dataSource: ["certificate", "user", "course"],
		futureLogic: [
			"Find certificate by certificateCode.",
			"Return certificate owner, course, and issued date.",
		],
	});
};

export const getCertificateDetailsSkeleton = () => {
	return createAdminEndpointSkeleton({
		area: "Certificates",
		api: "Certificate details",
		method: "GET",
		path: "/admin/certificates/:certificateId",
		businessMeaning:
			"Admin sees one certificate with student, course, enrollment, and PDF asset.",
		dataSource: ["certificate", "user", "course", "enrollment", "media_asset"],
		futureLogic: [
			"Load one certificate and related records.",
			"Show PDF asset when it exists.",
		],
	});
};
