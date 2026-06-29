const appName = "Skill Forge";

type EmailAction = {
	label: string;
	url: string;
};

type EmailLayoutProps = {
	preview: string;
	title: string;
	body: string;
	action?: EmailAction;
	code?: string;
	footer?: string;
};

const escapeHtml = (value: string) =>
	value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");

const paragraphs = (body: string) =>
	body
		.split("\n")
		.map(
			(line) =>
				`<p style="margin:0 0 16px;color:#334155;font-size:16px;line-height:24px;">${escapeHtml(line)}</p>`,
		)
		.join("");

const emailLayout = ({
	preview,
	title,
	body,
	action,
	code,
	footer = "If you did not request this email, you can safely ignore it.",
}: EmailLayoutProps) => {
	const escapedPreview = escapeHtml(preview);
	const escapedTitle = escapeHtml(title);
	const escapedFooter = escapeHtml(footer);

	return `<!doctype html>
<html lang="en">
	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width, initial-scale=1">
		<meta name="color-scheme" content="light">
		<meta name="supported-color-schemes" content="light">
		<title>${escapedTitle}</title>
	</head>
	<body style="margin:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
		<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapedPreview}</div>
		<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;padding:32px 16px;">
			<tr>
				<td align="center">
					<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
						<tr>
							<td style="padding:28px 32px 18px;border-bottom:1px solid #e2e8f0;">
								<div style="font-size:14px;font-weight:700;letter-spacing:0;color:#2563eb;text-transform:uppercase;">${appName}</div>
							</td>
						</tr>
						<tr>
							<td style="padding:32px;">
								<h1 style="margin:0 0 18px;color:#0f172a;font-size:24px;line-height:32px;font-weight:700;">${escapedTitle}</h1>
								${paragraphs(body)}
								${
									code
										? `<div style="margin:24px 0;padding:18px 20px;background:#f1f5f9;border:1px solid #cbd5e1;border-radius:8px;text-align:center;font-size:32px;line-height:40px;font-weight:700;letter-spacing:8px;color:#0f172a;">${escapeHtml(code)}</div>`
										: ""
								}
								${
									action
										? `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:24px 0 8px;">
											<tr>
												<td style="border-radius:6px;background:#2563eb;">
													<a href="${escapeHtml(action.url)}" style="display:inline-block;padding:12px 18px;color:#ffffff;font-size:15px;line-height:20px;font-weight:700;text-decoration:none;">${escapeHtml(action.label)}</a>
												</td>
											</tr>
										</table>`
										: ""
								}
								<p style="margin:24px 0 0;color:#64748b;font-size:14px;line-height:22px;">${escapedFooter}</p>
							</td>
						</tr>
					</table>
				</td>
			</tr>
		</table>
	</body>
</html>`;
};

export const verifyEmailTemplate = ({ otp }: { otp: string }) =>
	emailLayout({
		preview: "Verify your Skill Forge email address.",
		title: "Verify your email",
		body: "Use this verification code to finish setting up your Skill Forge account.",
		code: otp,
		footer:
			"This code expires soon. If you did not request it, you can safely ignore this email.",
	});

export const resetPasswordEmailTemplate = ({ otp }: { otp: string }) =>
	emailLayout({
		preview: "Reset your Skill Forge password.",
		title: "Reset your password",
		body: "We received a request to reset your Skill Forge password. Use this verification code to choose a new password.",
		code: otp,
		footer:
			"This password reset code expires soon. If you did not request it, no changes were made to your account.",
	});

export const welcomeEmailTemplate = ({
	name,
	url,
}: {
	name?: string | null;
	url: string;
}) =>
	emailLayout({
		preview: "Your Skill Forge account is ready.",
		title: "Welcome to Skill Forge",
		body: `Hi ${name || "there"},

Your account has been created successfully. Verify your email to finish setting up your account.`,
		action: {
			label: "Go to Skill Forge",
			url,
		},
		footer: "Thanks for joining Skill Forge.",
	});
