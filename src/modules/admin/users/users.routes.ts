import { Hono } from "hono";
import {
	getUserActivity,
	getUserDetails,
	listUsers,
} from "./users.controller.js";

const usersRoute = new Hono()
	// Business: admin sees all users with filters later.
	.get("/", ...listUsers)
	// Business: admin sees one user's full account story.
	.get("/:userId", ...getUserDetails)
	// Business: admin sees one user's recent platform activity.
	.get("/:userId/activity", ...getUserActivity);

export default usersRoute;
