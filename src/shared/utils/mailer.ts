import { Resend } from "resend";
import { env } from "../constants/env.js";

const resend = new Resend(env.RESEND);

type SendEmailOptions = {
	to: string;
	subject: string;
	html: string;
	replyTo?: string;
};

export const sendEmail = async ({
	to,
	subject,
	html,
	replyTo,
}: SendEmailOptions) => {
	const { error } = await resend.emails.send({
		from: env.EMAIL_FROM,
		to,
		subject,
		html,
		replyTo,
	});

	if (error) {
		throw error;
	}
};
