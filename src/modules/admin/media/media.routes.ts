import { Hono } from "hono";
import {
	getMediaAssetDetails,
	listMediaAssets,
} from "./media.controller.js";

const mediaRoute = new Hono()
	// Business: admin sees all uploaded files.
	.get("/assets", ...listMediaAssets)
	// Business: admin sees one uploaded file and usage.
	.get("/assets/:assetId", ...getMediaAssetDetails);

export default mediaRoute;
