/**
 * Composition root (spec §4a). This is the ONLY file that knows Cloudflare
 * exists. It builds the adapter set from the environment; everything else
 * depends on the ports in `$lib/server/ports`.
 */
import { env } from '$env/dynamic/private';
import { getDb } from '$lib/server/db';
import { appConfig } from '$lib/server/db/app.schema';
import type {
	BlobStore,
	Deferred,
	EventQuery,
	EventSink,
	GeoResolver,
	LinkStore,
	Mailer
} from '$lib/server/ports';
import { kvLinkStore } from '$lib/server/adapters/cloudflare/kv-link-store';
import { aeEventSink } from '$lib/server/adapters/cloudflare/ae-event-sink';
import { aeEventQuery } from '$lib/server/adapters/cloudflare/ae-event-query';
import { cfMailer } from '$lib/server/adapters/cloudflare/cf-mailer';
import { r2BlobStore } from '$lib/server/adapters/cloudflare/r2-blob-store';
import { waitUntilDeferred } from '$lib/server/adapters/cloudflare/waituntil-deferred';
import { cfGeoResolver } from '$lib/server/adapters/cloudflare/cf-geo-resolver';
import { resendMailer } from '$lib/server/adapters/resend-mailer';
import { noopMailer } from '$lib/server/adapters/noop-mailer';

export interface AppConfig {
	/** Passkey Relying Party ID — the domain. Captured at /setup. Changing it invalidates passkeys (spec §7). */
	rpId: string;
	appName: string;
	origin: string;
}

export interface AppContext {
	db: ReturnType<typeof getDb>;
	links: LinkStore;
	events: EventSink;
	/** null when CF_ANALYTICS_TOKEN / CLOUDFLARE_ACCOUNT_ID are not configured. */
	eventQuery: EventQuery | null;
	mailer: Mailer;
	/** false for email-less (single-user) deployments — magic link login is unavailable. */
	emailEnabled: boolean;
	blobs: BlobStore;
	deferred: Deferred;
	geo: GeoResolver;
}

/** AppContext with deployment config resolved — required to instantiate auth. */
export interface ResolvedAppContext extends AppContext {
	config: AppConfig;
}

export const buildContext = (platform: App.Platform): AppContext => {
	const { DB, LINKS, SCANS, EMAIL, ASSETS_BUCKET } = platform.env;

	const emailProvider = env.EMAIL_PROVIDER ?? 'cloudflare';
	const emailFrom = env.EMAIL_FROM ?? '';
	let mailer: Mailer;
	let emailEnabled = true;
	if (!emailFrom || emailProvider === 'none') {
		mailer = noopMailer();
		emailEnabled = false;
	} else if (emailProvider === 'resend' && env.RESEND_API_KEY) {
		mailer = resendMailer(env.RESEND_API_KEY, emailFrom);
	} else {
		mailer = cfMailer(EMAIL, emailFrom);
	}

	const eventQuery =
		env.CF_ANALYTICS_TOKEN && env.CLOUDFLARE_ACCOUNT_ID
			? aeEventQuery({ accountId: env.CLOUDFLARE_ACCOUNT_ID, apiToken: env.CF_ANALYTICS_TOKEN })
			: null;

	return {
		db: getDb(DB),
		links: kvLinkStore(LINKS),
		events: aeEventSink(SCANS),
		eventQuery,
		mailer,
		emailEnabled,
		blobs: r2BlobStore(ASSETS_BUCKET, `${env.ORIGIN ?? ''}/app/assets`),
		deferred: waitUntilDeferred(platform.ctx),
		geo: cfGeoResolver()
	};
};

/**
 * Loads deployment config from D1 (written by /setup), falling back to env +
 * the request origin before setup has run.
 */
export const resolveContext = async (
	ctx: AppContext,
	requestOrigin: string
): Promise<ResolvedAppContext> => {
	const rows = await ctx.db.select().from(appConfig);
	const get = (key: string) => rows.find((r) => r.key === key)?.value;

	const origin = get('origin') ?? env.ORIGIN ?? requestOrigin;
	return {
		...ctx,
		config: {
			rpId: get('rp_id') ?? new URL(origin).hostname,
			appName: get('app_name') ?? 'Scanimal',
			origin
		}
	};
};

export const saveConfig = async (ctx: AppContext, config: AppConfig): Promise<void> => {
	const entries: [string, string][] = [
		['rp_id', config.rpId],
		['app_name', config.appName],
		['origin', config.origin]
	];
	await Promise.all(
		entries.map(([key, value]) =>
			ctx.db
				.insert(appConfig)
				.values({ key, value })
				.onConflictDoUpdate({ target: appConfig.key, set: { value } })
		)
	);
};
