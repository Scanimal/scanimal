import type { Mailer } from '$lib/server/ports';

/**
 * Email-less deployments are first-class (spec §9): single-user setups can skip
 * email entirely. Invites are link-based, and setup does not require email —
 * only the magic-link *fallback* login path degrades.
 */
export const noopMailer = (): Mailer => ({
	async send(msg) {
		throw new Error(
			`Email is not configured (attempted to send "${msg.subject}" to ${msg.to}). ` +
				'Configure the EMAIL binding or set EMAIL_PROVIDER=resend with RESEND_API_KEY.'
		);
	}
});
