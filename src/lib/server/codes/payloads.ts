/**
 * Code kinds and their payloads.
 *
 * Three kinds, split by whether the QR encodes a short link we control:
 *
 * - `link`  — QR encodes `origin/slug`. Redirects via KV. Fully dynamic + tracked.
 * - `vcard` — QR encodes `origin/slug` too, but the destination is a landing page
 *             we host at `/v/<slug>`. Still dynamic and tracked, and the contact
 *             details stay editable after printing.
 * - `wifi`  — QR encodes a `WIFI:` URI **directly**, because a redirect cannot make
 *             a phone join a network. Static: never written to KV, so the redirect
 *             hook never sees it and no scans are recorded. This is inherent to the
 *             format, not a limitation we chose.
 *
 * `codes.destination` therefore means "what this code resolves to": a URL for
 * `link`/`vcard`, and the literal QR payload for `wifi`.
 */

export const CODE_KINDS = ['link', 'vcard', 'wifi'] as const;
export type CodeKind = (typeof CODE_KINDS)[number];

export const isCodeKind = (v: unknown): v is CodeKind =>
	typeof v === 'string' && (CODE_KINDS as readonly string[]).includes(v);

/** Kinds whose QR encodes data directly — no redirect, and therefore no analytics. */
export const isStaticKind = (kind: CodeKind): boolean => kind === 'wifi';

export type WifiEncryption = 'WPA' | 'WEP' | 'nopass';

export interface WifiPayload {
	ssid: string;
	password: string;
	encryption: WifiEncryption;
	hidden: boolean;
}

export interface VCardPayload {
	firstName: string;
	lastName: string;
	organization: string;
	jobTitle: string;
	email: string;
	phone: string;
	website: string;
	note: string;
}

/**
 * `WIFI:` fields are delimited by `;` and `:`, so those characters — plus `,`,
 * `"` and the escape character itself — must be backslash-escaped or a password
 * containing them silently produces an unjoinable network.
 */
const escapeWifi = (value: string): string => value.replace(/([\\;,:"])/g, '\\$1');

export const encodeWifi = (p: WifiPayload): string => {
	const parts = [`S:${escapeWifi(p.ssid)}`];
	parts.push(`T:${p.encryption}`);
	if (p.encryption !== 'nopass') parts.push(`P:${escapeWifi(p.password)}`);
	if (p.hidden) parts.push('H:true');
	return `WIFI:${parts.join(';')};;`;
};

/** vCard values escape `\`, `;` and `,`, and newlines become the literal `\n`. */
const escapeVCard = (v: string): string => v.replace(/([\\;,])/g, '\\$1').replace(/\n/g, '\\n');

/** vCard 3.0 — the version both iOS and Android import without complaint. */
export const encodeVCard = (p: VCardPayload): string => {
	// Long lines are legal here; we skip folding because consumers we target
	// (iOS/Android contact import) handle unfolded 3.0 fine.
	const esc = escapeVCard;
	const full = [p.firstName, p.lastName].filter(Boolean).join(' ');

	const lines = [
		'BEGIN:VCARD',
		'VERSION:3.0',
		`N:${esc(p.lastName)};${esc(p.firstName)};;;`,
		`FN:${esc(full)}`
	];
	if (p.organization) lines.push(`ORG:${esc(p.organization)}`);
	if (p.jobTitle) lines.push(`TITLE:${esc(p.jobTitle)}`);
	if (p.phone) lines.push(`TEL;TYPE=CELL:${esc(p.phone)}`);
	if (p.email) lines.push(`EMAIL;TYPE=INTERNET:${esc(p.email)}`);
	if (p.website) lines.push(`URL:${esc(p.website)}`);
	if (p.note) lines.push(`NOTE:${esc(p.note)}`);
	lines.push('END:VCARD');

	return `${lines.join('\r\n')}\r\n`;
};

const str = (v: unknown): string => (typeof v === 'string' ? v : '');

export const emptyWifi = (): WifiPayload => ({
	ssid: '',
	password: '',
	encryption: 'WPA',
	hidden: false
});

export const emptyVCard = (): VCardPayload => ({
	firstName: '',
	lastName: '',
	organization: '',
	jobTitle: '',
	email: '',
	phone: '',
	website: '',
	note: ''
});

/** Payloads are stored as JSON text; parsing never throws so a bad row can still render. */
export const parseWifi = (json: string | null): WifiPayload => {
	if (!json) return emptyWifi();
	try {
		const raw = JSON.parse(json) as Record<string, unknown>;
		const encryption = raw.encryption;
		return {
			ssid: str(raw.ssid),
			password: str(raw.password),
			encryption: encryption === 'WEP' || encryption === 'nopass' ? encryption : 'WPA',
			hidden: raw.hidden === true
		};
	} catch {
		return emptyWifi();
	}
};

export const parseVCard = (json: string | null): VCardPayload => {
	if (!json) return emptyVCard();
	try {
		const raw = JSON.parse(json) as Record<string, unknown>;
		return {
			firstName: str(raw.firstName),
			lastName: str(raw.lastName),
			organization: str(raw.organization),
			jobTitle: str(raw.jobTitle),
			email: str(raw.email),
			phone: str(raw.phone),
			website: str(raw.website),
			note: str(raw.note)
		};
	} catch {
		return emptyVCard();
	}
};

export const vcardDisplayName = (p: VCardPayload): string =>
	[p.firstName, p.lastName].filter(Boolean).join(' ') || p.organization || 'Contact';
