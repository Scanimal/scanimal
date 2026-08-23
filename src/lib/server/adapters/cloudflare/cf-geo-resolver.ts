import type { GeoResolver } from '$lib/server/ports';

/** Country and city come free at the Cloudflare edge via request.cf. */
export const cfGeoResolver = (): GeoResolver => ({
	resolve(request) {
		const cf = (request as Request & { cf?: IncomingRequestCfProperties }).cf;
		return {
			country: (cf?.country as string | undefined) ?? '',
			city: (cf?.city as string | undefined) ?? ''
		};
	}
});
