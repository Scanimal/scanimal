import type { Mailer } from '$lib/server/ports';

const encodeSubject = (subject: string) =>
	/^[\x20-\x7e]*$/.test(subject)
		? subject
		: `=?utf-8?B?${btoa(String.fromCharCode(...new TextEncoder().encode(subject)))}?=`;

const buildMime = (opts: {
	from: string;
	to: string;
	subject: string;
	html: string;
	text: string;
}) => {
	const boundary = `----=_scanimal_${crypto.randomUUID()}`;
	return [
		`From: ${opts.from}`,
		`To: ${opts.to}`,
		`Subject: ${encodeSubject(opts.subject)}`,
		'MIME-Version: 1.0',
		`Content-Type: multipart/alternative; boundary="${boundary}"`,
		'',
		`--${boundary}`,
		'Content-Type: text/plain; charset=utf-8',
		'Content-Transfer-Encoding: 8bit',
		'',
		opts.text,
		'',
		`--${boundary}`,
		'Content-Type: text/html; charset=utf-8',
		'Content-Transfer-Encoding: 8bit',
		'',
		opts.html,
		'',
		`--${boundary}--`,
		''
	].join('\r\n');
};

/**
 * Cloudflare Email Sending (beta). Requires Workers Paid and the sending
 * domain on Cloudflare DNS. Only used for magic links and invites (spec §3).
 */
export const cfMailer = (email: SendEmail, from: string): Mailer => ({
	async send(msg) {
		// Dynamic import: `cloudflare:email` only resolves inside the Workers runtime.
		const { EmailMessage } = await import('cloudflare:email');
		const raw = buildMime({ from, ...msg });
		await email.send(new EmailMessage(from, msg.to, raw));
	}
});
