import { createAdminEndpointSkeleton } from "../admin.service.js";

export const listMediaAssetsSkeleton = () => {
	return createAdminEndpointSkeleton({
		area: "Media",
		api: "List media assets",
		method: "GET",
		path: "/admin/media/assets",
		businessMeaning:
			"Admin sees uploaded images, videos, documents, and certificate PDFs.",
		dataSource: ["media_asset", "user"],
		futureLogic: [
			"Return media assets with owner, kind, provider, mime type, size, and created date.",
			"Support filters by kind, owner, provider, and date.",
		],
	});
};

export const getMediaAssetDetailsSkeleton = () => {
	return createAdminEndpointSkeleton({
		area: "Media",
		api: "Media asset details",
		method: "GET",
		path: "/admin/media/assets/:assetId",
		businessMeaning:
			"Admin sees one uploaded file and where it is used.",
		dataSource: ["media_asset", "course", "lesson", "certificate"],
		futureLogic: [
			"Load the media asset and related course, lesson, or certificate records.",
			"Help admin inspect storage and content usage.",
		],
	});
};
