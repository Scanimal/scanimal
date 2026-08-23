import { describe, expect, it } from 'vitest';
import { isReservedPath, isValidSlug, kvKey } from './links';

describe('isReservedPath', () => {
	it('reserves the root and system prefixes', () => {
		for (const path of [
			'/',
			'/app',
			'/app/new',
			'/api/auth/session',
			'/auth/whatever',
			'/_app/immutable/x.js',
			'/setup',
			'/setup/complete',
			'/login',
			'/invite/abc',
			'/favicon.ico',
			'/robots.txt',
			'/.well-known/webauthn'
		]) {
			expect(isReservedPath(path), path).toBe(true);
		}
	});

	it('does not reserve slug-like paths', () => {
		for (const path of ['/my-code', '/abc123', '/appetizer', '/loginz']) {
			expect(isReservedPath(path), path).toBe(false);
		}
	});
});

describe('isValidSlug', () => {
	it('accepts simple slugs', () => {
		for (const slug of ['a', 'abc', 'my-code', 'snake_case', 'X9', 'a'.repeat(64)]) {
			expect(isValidSlug(slug), slug).toBe(true);
		}
	});

	it('rejects invalid or reserved slugs', () => {
		for (const slug of [
			'',
			'-leading',
			'trailing-',
			'has space',
			'has/slash',
			'has.dot',
			'a'.repeat(65),
			'app',
			'login',
			'setup',
			'api'
		]) {
			expect(isValidSlug(slug), slug).toBe(false);
		}
	});
});

describe('kvKey', () => {
	it('is hostname-independent in v1 (single org, globally unique slugs)', () => {
		expect(kvKey('a.example.com', 'promo')).toBe(kvKey('b.example.com', 'promo'));
		expect(kvKey('example.com', 'promo')).toBe('promo');
	});
});
