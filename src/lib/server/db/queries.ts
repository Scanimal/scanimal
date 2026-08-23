/**
 * Org-scoped query helpers (spec §8). Every query filters on organization_id.
 * Routes must never query `codes` directly — always go through this module.
 *
 * Write-path invariant (spec §4): D1 is the source of truth — write D1 first,
 * then update KV. The redirect path reads only KV.
 */
import { and, desc, eq } from 'drizzle-orm';
import { codes, codeRevisions } from './app.schema';
import { member } from './auth.schema';
import { isValidSlug, kvKey } from '$lib/server/links';
import type { AppContext } from '$lib/server/context';
import type { LinkRecord } from '$lib/server/ports';

export type OrgRole = 'owner' | 'admin' | 'member';

export interface OrgScope {
	organizationId: string;
	userId: string;
	role: OrgRole;
}

export type Code = typeof codes.$inferSelect;

/** Admins and owners see all codes in the org; members only their own (spec §8). */
export const canSeeAll = (scope: OrgScope): boolean =>
	scope.role === 'owner' || scope.role === 'admin';

/** Resolves the requesting user's org membership. v1 is single-org: first membership wins. */
export const getScope = async (ctx: AppContext, userId: string): Promise<OrgScope | null> => {
	const rows = await ctx.db.select().from(member).where(eq(member.userId, userId)).limit(1);
	const m = rows[0];
	if (!m) return null;
	return { organizationId: m.organizationId, userId, role: m.role as OrgRole };
};

const scopedWhere = (scope: OrgScope) =>
	canSeeAll(scope)
		? eq(codes.organizationId, scope.organizationId)
		: and(eq(codes.organizationId, scope.organizationId), eq(codes.userId, scope.userId));

export const listCodes = (ctx: AppContext, scope: OrgScope): Promise<Code[]> =>
	ctx.db.select().from(codes).where(scopedWhere(scope)).orderBy(desc(codes.createdAt));

export const getCode = async (
	ctx: AppContext,
	scope: OrgScope,
	id: string
): Promise<Code | null> => {
	const rows = await ctx.db
		.select()
		.from(codes)
		.where(and(eq(codes.id, id), scopedWhere(scope)))
		.limit(1);
	return rows[0] ?? null;
};

const toLinkRecord = (code: Code): LinkRecord => ({
	codeId: code.id,
	organizationId: code.organizationId,
	destination: code.destination,
	active: code.active
});

/** Sync a code to the hot link store. Inactive codes are removed so redirects 404. */
const syncLink = async (ctx: AppContext, code: Code): Promise<void> => {
	const key = kvKey('', code.slug);
	if (code.active) {
		await ctx.links.put(key, toLinkRecord(code));
	} else {
		await ctx.links.delete(key);
	}
};

export class SlugError extends Error {}

export const createCode = async (
	ctx: AppContext,
	scope: OrgScope,
	input: { slug: string; destination: string; title?: string; styleJson?: string }
): Promise<Code> => {
	if (!isValidSlug(input.slug)) {
		throw new SlugError(
			'Slug must be 1–64 characters (letters, digits, - or _) and not a reserved path.'
		);
	}
	const existing = await ctx.db
		.select({ id: codes.id })
		.from(codes)
		.where(eq(codes.slug, input.slug))
		.limit(1);
	if (existing.length > 0) throw new SlugError('That slug is already taken.');

	const [code] = await ctx.db
		.insert(codes)
		.values({
			id: crypto.randomUUID(),
			organizationId: scope.organizationId,
			userId: scope.userId,
			slug: input.slug,
			destination: input.destination,
			title: input.title ?? null,
			styleJson: input.styleJson ?? null
		})
		.returning();

	await syncLink(ctx, code);
	return code;
};

export const updateCode = async (
	ctx: AppContext,
	scope: OrgScope,
	id: string,
	patch: { destination?: string; title?: string; styleJson?: string; active?: boolean }
): Promise<Code | null> => {
	const current = await getCode(ctx, scope, id);
	if (!current) return null;

	const destinationChanged =
		patch.destination !== undefined && patch.destination !== current.destination;

	const [updated] = await ctx.db
		.update(codes)
		.set({
			...(patch.destination !== undefined && { destination: patch.destination }),
			...(patch.title !== undefined && { title: patch.title }),
			...(patch.styleJson !== undefined && { styleJson: patch.styleJson }),
			...(patch.active !== undefined && { active: patch.active })
		})
		.where(and(eq(codes.id, id), eq(codes.organizationId, scope.organizationId)))
		.returning();

	if (destinationChanged) {
		await ctx.db.insert(codeRevisions).values({
			id: crypto.randomUUID(),
			organizationId: scope.organizationId,
			codeId: id,
			destination: current.destination,
			changedBy: scope.userId
		});
	}

	await syncLink(ctx, updated);
	return updated;
};

export const deleteCode = async (
	ctx: AppContext,
	scope: OrgScope,
	id: string
): Promise<boolean> => {
	const current = await getCode(ctx, scope, id);
	if (!current) return false;

	await ctx.db.delete(codeRevisions).where(eq(codeRevisions.codeId, id));
	await ctx.db
		.delete(codes)
		.where(and(eq(codes.id, id), eq(codes.organizationId, scope.organizationId)));
	await ctx.links.delete(kvKey('', current.slug));
	return true;
};

export const listRevisions = async (ctx: AppContext, scope: OrgScope, codeId: string) => {
	const code = await getCode(ctx, scope, codeId);
	if (!code) return [];
	return ctx.db
		.select()
		.from(codeRevisions)
		.where(
			and(eq(codeRevisions.codeId, codeId), eq(codeRevisions.organizationId, scope.organizationId))
		)
		.orderBy(desc(codeRevisions.changedAt));
};
