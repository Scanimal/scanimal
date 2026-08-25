import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { user } from './auth.schema';

/**
 * App tables (spec §5). Better Auth owns its own tables (user, session, account,
 * verification, passkey, organization, member, invitation) — only app tables
 * are defined here.
 *
 * SQL portability rules (spec §4a):
 * - Timestamps are integer epoch millis, generated in application code.
 * - No AUTOINCREMENT — IDs generated in application code.
 * - organization_id on every table, even though v1 is single-org.
 */

export const codes = sqliteTable(
	'codes',
	{
		id: text('id').primaryKey(),
		organizationId: text('organization_id').notNull(),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		slug: text('slug').notNull(),
		/**
		 * 'link' | 'vcard' | 'wifi' — see $lib/server/codes/payloads.
		 * Static kinds (wifi) are never written to the link store, so the redirect
		 * hook never sees them and records no scans.
		 */
		kind: text('kind').notNull().default('link'),
		/**
		 * What the code resolves to: a URL for 'link' and 'vcard' (the latter points
		 * at the hosted `/v/<slug>` landing page), or the literal QR payload for
		 * static kinds like 'wifi'.
		 */
		destination: text('destination').notNull(),
		/** Structured fields for 'wifi'/'vcard' as JSON, so edits round-trip. */
		payload: text('payload'),
		title: text('title'),
		/** qr-code-styling options blob */
		styleJson: text('style_json'),
		logoKey: text('logo_key'),
		active: integer('active', { mode: 'boolean' }).notNull().default(true),
		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.$defaultFn(() => new Date())
			.notNull(),
		updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
			.$defaultFn(() => new Date())
			.$onUpdate(() => new Date())
			.notNull()
	},
	(t) => [
		uniqueIndex('idx_codes_slug').on(t.slug),
		index('idx_codes_org').on(t.organizationId),
		index('idx_codes_user').on(t.userId)
	]
);

/**
 * Audit trail for destination changes — "what did this point to in March?"
 */
export const codeRevisions = sqliteTable(
	'code_revisions',
	{
		id: text('id').primaryKey(),
		organizationId: text('organization_id').notNull(),
		codeId: text('code_id')
			.notNull()
			.references(() => codes.id, { onDelete: 'cascade' }),
		destination: text('destination').notNull(),
		changedBy: text('changed_by').notNull(),
		changedAt: integer('changed_at', { mode: 'timestamp_ms' })
			.$defaultFn(() => new Date())
			.notNull()
	},
	(t) => [
		index('idx_code_revisions_code').on(t.codeId),
		index('idx_code_revisions_org').on(t.organizationId)
	]
);

/**
 * Deployment-level config captured at /setup: passkey RP-ID, app name, origin.
 * Key/value so v2 additions don't need migrations.
 */
export const appConfig = sqliteTable('app_config', {
	key: text('key').primaryKey(),
	value: text('value').notNull()
});
