import { Hono } from "hono";
import {
	getCourseCurriculum,
	getCourseDetails,
	getCoursePerformance,
	listCourses,
	updateCourse,
	updateCourseStatus,
} from "./courses.controller.js";

const coursesRoute = new Hono()
	// Business: admin sees all courses in the marketplace.
	.get("/", ...listCourses)
	// Business: admin sees one course with all important data.
	.get("/:courseId", ...getCourseDetails)
	// Business: admin can fix course catalog fields.
	.patch("/:courseId", ...updateCourse)
	// Business: admin can publish, draft, or archive a course.
	.patch("/:courseId/status", ...updateCourseStatus)
	// Business: admin reviews sections, lessons, and quizzes.
	.get("/:courseId/curriculum", ...getCourseCurriculum)
	// Business: admin checks sales and completion data for one course.
	.get("/:courseId/performance", ...getCoursePerformance);

export default coursesRoute;
