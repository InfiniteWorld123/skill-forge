import { Hono } from "hono";
import {
	getTeacherDetails,
	listTeachers,
	updateTeacherVisibility,
} from "./teachers.controller.js";

const teachersRoute = new Hono()
	// Business: admin sees all teacher profiles.
	.get("/", ...listTeachers)
	// Business: admin sees one teacher profile and performance.
	.get("/:teacherProfileId", ...getTeacherDetails)
	// Business: admin can make a teacher profile public or private.
	.patch("/:teacherProfileId/visibility", ...updateTeacherVisibility);

export default teachersRoute;
