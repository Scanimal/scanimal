import type { Mailer } from '$lib/server/ports';

/**
 * Resend fallback (spec §9): lets deployers skip Workers Paid, or deploy when
 * their domain isn't on Cloudflare DNS. Set EMAIL_PROVIDER=resend + RESEND_API_KEY.
 * This is the one place a non-Cloudflare dependency is justified.
 */
export const resendMailer = (apiKey: string, from: string): Mailer => ({
	async send(msg) {
		const res = await fetch('https://api.resend.com/emails', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${apiKey}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				from,
				to: [msg.to],
				subject: msg.subject,
				html: msg.html,
				text: msg.text
			})
		});
		if (!res.ok) {
			throw new Error(`Resend send failed: ${res.status} ${await res.text()}`);
		}
	}
});
