import type { BlobStore } from '$lib/server/ports';

/**
 * Uploaded blobs are served back through the app (see /app assets route or a
 * public bucket domain). `publicBaseUrl` is where a stored key is reachable.
 */
export const r2BlobStore = (bucket: R2Bucket, publicBaseUrl: string): BlobStore => ({
	async put(key, body, contentType) {
		await bucket.put(key, body, { httpMetadata: { contentType } });
	},
	url(key) {
		return `${publicBaseUrl.replace(/\/$/, '')}/${key}`;
	}
});
