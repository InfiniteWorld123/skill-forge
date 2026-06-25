import { createFactory } from "hono/factory"

const factory = createFactory()

export const signUp = factory.createHandlers((c) => {
    return c.text("sign-up")
})
