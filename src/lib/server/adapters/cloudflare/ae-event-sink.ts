import type { EventSink } from '$lib/server/ports';

/**
 * Analytics Engine allows ONE index per data point (spec §10.2) — spent on
 * organization_id so per-tenant queries stay cheap when v2 multi-tenancy lands.
 * code_id goes in blobs. Blob order is a wire format: changing it breaks
 * existing data. Keep in sync with ae-event-query.ts.
 *
 * blob1: codeId, blob2: country, blob3: userAgent, blob4: referrer, blob5: city
 */
export const aeEventSink = (dataset: AnalyticsEngineDataset): EventSink => ({
	record(event) {
		dataset.writeDataPoint({
			indexes: [event.organizationId],
			blobs: [event.codeId, event.country, event.userAgent, event.referrer, event.city],
			doubles: [1]
		});
	}
});
