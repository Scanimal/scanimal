/**
 * Slug rules and the KV key scheme, shared by the redirect hook and the code
 * write path (spec §5, §6).
 */

/** Path prefixes that must never be treated as slugs. Validated on creation too. */
export const RESERVED_PREFIXES = [
	'/app',
	'/api',
	'/auth',
	'/_app',
	'/setup',
	'/login',
	'/invite',
	'/favicon.ico',
	'/robots.txt',
	'/.well-known'
] as const;

export const isReservedPath = (pathname: string): boolean =>
	pathname === '/' ||
	RESERVED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

const SLUG_PATTERN = /^[a-zA-Z0-9](?:[a-zA-Z0-9_-]{0,62}[a-zA-Z0-9])?$/;

export const isValidSlug = (slug: string): boolean =>
	SLUG_PATTERN.test(slug) && !isReservedPath(`/${slug}`);

/**
 * Slugs are globally unique in v1 (single org), so hostname is ignored.
 * When v2 adds multi-tenancy this becomes `${hostname}:${slug}` — one edit,
 * here (spec §5 "Slug uniqueness").
 */
export const kvKey = (_hostname: string, slug: string): string => slug;
