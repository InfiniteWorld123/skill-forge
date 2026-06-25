import { Hono } from "hono"
import { signUp } from "../controllers/auth/auth.controller.js"

const authRoute = new Hono()

authRoute.post("/sign-up", ...signUp)

export default authRoute