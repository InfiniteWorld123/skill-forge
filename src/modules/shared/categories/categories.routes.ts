import { Hono } from "hono";
import { listCategories, listTags } from "./categories.controller.js";

const categoriesRoute = new Hono()
	.get("/", ...listCategories)
	.get("/tags", ...listTags);

export default categoriesRoute;
