import { describe, expect, it } from 'vitest';
import {
	encodeVCard,
	encodeWifi,
	emptyVCard,
	isStaticKind,
	parseVCard,
	parseWifi,
	vcardDisplayName
} from './payloads';

describe('encodeWifi', () => {
	it('encodes a WPA network', () => {
		expect(
			encodeWifi({ ssid: 'Cafe', password: 'hunter2', encryption: 'WPA', hidden: false })
		).toBe('WIFI:S:Cafe;T:WPA;P:hunter2;;');
	});

	it('omits the password for open networks', () => {
		expect(
			encodeWifi({ ssid: 'Free', password: 'ignored', encryption: 'nopass', hidden: false })
		).toBe('WIFI:S:Free;T:nopass;;');
	});

	it('flags hidden networks', () => {
		expect(encodeWifi({ ssid: 'Ghost', password: 'pw', encryption: 'WPA', hidden: true })).toBe(
			'WIFI:S:Ghost;T:WPA;P:pw;H:true;;'
		);
	});

	it('escapes delimiter characters so the payload stays parseable', () => {
		// A password containing ; : , " or \ would otherwise truncate the field.
		expect(
			encodeWifi({ ssid: 'A;B', password: 'p:a,s"s\\w', encryption: 'WPA', hidden: false })
		).toBe('WIFI:S:A\\;B;T:WPA;P:p\\:a\\,s\\"s\\\\w;;');
	});
});

describe('encodeVCard', () => {
	it('emits a 3.0 card with the fields that are set', () => {
		const out = encodeVCard({
			...emptyVCard(),
			firstName: 'Ada',
			lastName: 'Lovelace',
			organization: 'Analytical Engines',
			email: 'ada@example.com'
		});

		expect(out).toContain('BEGIN:VCARD');
		expect(out).toContain('VERSION:3.0');
		expect(out).toContain('N:Lovelace;Ada;;;');
		expect(out).toContain('FN:Ada Lovelace');
		expect(out).toContain('ORG:Analytical Engines');
		expect(out).toContain('EMAIL;TYPE=INTERNET:ada@example.com');
		expect(out).toContain('END:VCARD');
	});

	it('omits absent optional fields rather than emitting empty ones', () => {
		const out = encodeVCard({ ...emptyVCard(), firstName: 'Solo' });
		expect(out).not.toContain('ORG:');
		expect(out).not.toContain('TEL');
		expect(out).not.toContain('URL:');
	});

	it('escapes commas and semicolons in values', () => {
		const out = encodeVCard({ ...emptyVCard(), organization: 'Smith, Jones; Co' });
		expect(out).toContain('ORG:Smith\\, Jones\\; Co');
	});

	it('uses CRLF line endings', () => {
		expect(encodeVCard({ ...emptyVCard(), firstName: 'X' })).toContain('\r\n');
	});
});

describe('payload parsing', () => {
	it('round-trips wifi payloads', () => {
		const p = { ssid: 'Net', password: 'pw', encryption: 'WEP' as const, hidden: true };
		expect(parseWifi(JSON.stringify(p))).toEqual(p);
	});

	it('falls back to defaults on malformed or missing json', () => {
		expect(parseWifi('not json')).toEqual(parseWifi(null));
		expect(parseWifi(null).encryption).toBe('WPA');
		expect(parseVCard('{{{').firstName).toBe('');
	});

	it('coerces an unknown encryption to WPA', () => {
		expect(parseWifi(JSON.stringify({ ssid: 'a', encryption: 'WPA3' })).encryption).toBe('WPA');
	});
});

describe('vcardDisplayName', () => {
	it('prefers the person, then the organization, then a generic label', () => {
		expect(vcardDisplayName({ ...emptyVCard(), firstName: 'Ada' })).toBe('Ada');
		expect(vcardDisplayName({ ...emptyVCard(), organization: 'ACME' })).toBe('ACME');
		expect(vcardDisplayName(emptyVCard())).toBe('Contact');
	});
});

describe('isStaticKind', () => {
	it('marks only wifi as static — link and vcard both redirect and are tracked', () => {
		expect(isStaticKind('wifi')).toBe(true);
		expect(isStaticKind('link')).toBe(false);
		expect(isStaticKind('vcard')).toBe(false);
	});
});
