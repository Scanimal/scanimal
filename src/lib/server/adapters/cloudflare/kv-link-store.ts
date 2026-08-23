import type { LinkRecord, LinkStore } from '$lib/server/ports';

export const kvLinkStore = (kv: KVNamespace): LinkStore => ({
	async get(key) {
		return kv.get<LinkRecord>(key, 'json');
	},
	async put(key, value) {
		await kv.put(key, JSON.stringify(value));
	},
	async delete(key) {
		await kv.delete(key);
	}
});
