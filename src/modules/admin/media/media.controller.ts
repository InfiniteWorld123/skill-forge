import { sValidator } from "@hono/standard-validator";
import { createFactory } from "hono/factory";
import { jsonOk } from "../../../shared/utils/json-response.js";
import {
	getMediaAssetDetailsService,
	listMediaAssetsService,
} from "./media.service.js";
import { validationError } from "./media.utils.js";
import {
	getMediaAssetDetailsParamsSchema,
	listMediaAssetsQuerySchema,
} from "./media.validation.js";

const factory = createFactory();

// Business: admin can inspect uploaded files.
export const listMediaAssets = factory.createHandlers(
	sValidator("query", listMediaAssetsQuerySchema, (result, c) => {
		if (!result.success) return validationError(result, c);
	}),
	async (c) => {
		const data = await listMediaAssetsService(c.req.valid("query"));

		return jsonOk({
			c,
			message: "Media assets",
			data,
		});
	},
);

// Business: admin can inspect one uploaded file.
export const getMediaAssetDetails = factory.createHandlers(
	sValidator("param", getMediaAssetDetailsParamsSchema, (result, c) => {
		if (!result.success) return validationError(result, c);
	}),
	async (c) => {
		const { assetId } = c.req.valid("param");
		const data = await getMediaAssetDetailsService(assetId);

		return jsonOk({
			c,
			message: "Media asset details",
			data,
		});
	},
);
