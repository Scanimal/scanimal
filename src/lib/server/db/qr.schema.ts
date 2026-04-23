import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { user } from './auth.schema';

export const qrCode = sqliteTable(
	'qr_code',
	{
		id: text('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		slug: text('slug').notNull().unique(),
		label: text('label').notNull(),
		kind: text('kind').notNull().default('dynamic'),
		targetUrl: text('target_url').notNull(),
		styleJson: text('style_json'),
		logoR2Key: text('logo_r2_key'),
		archived: integer('archived', { mode: 'boolean' }).notNull().default(false),
		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.$onUpdate(() => new Date())
			.notNull()
	},
	(t) => [index('qr_code_userId_idx').on(t.userId)]
);

export const qrTargetHistory = sqliteTable(
	'qr_target_history',
	{
		id: text('id').primaryKey(),
		qrCodeId: text('qr_code_id')
			.notNull()
			.references(() => qrCode.id, { onDelete: 'cascade' }),
		targetUrl: text('target_url').notNull(),
		changedBy: text('changed_by')
			.notNull()
			.references(() => user.id),
		changedAt: integer('changed_at', { mode: 'timestamp_ms' })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull()
	},
	(t) => [index('qr_history_qrCodeId_idx').on(t.qrCodeId)]
);
