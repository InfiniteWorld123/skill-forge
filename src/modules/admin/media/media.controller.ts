import { createFactory } from "hono/factory";
import { jsonOk } from "../../../shared/utils/json-response.js";
import {
	getMediaAssetDetailsSkeleton,
	listMediaAssetsSkeleton,
} from "./media.service.js";

const factory = createFactory();

// Business: admin can inspect uploaded files.
export const listMediaAssets = factory.createHandlers(async (c) => {
	return jsonOk({
		c,
		message: "List media assets skeleton",
		data: listMediaAssetsSkeleton(),
	});
});

// Business: admin can inspect one uploaded file.
export const getMediaAssetDetails = factory.createHandlers(async (c) => {
	return jsonOk({
		c,
		message: "Media asset details skeleton",
		data: getMediaAssetDetailsSkeleton(),
	});
});
