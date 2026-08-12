// Shared between the webhook handler (writer) and AutoPull (reader).
// Module-level singleton: docportal runs one server process per instance.
const lastWebhookPullAt = new Map<string, number>();
const inFlight = new Set<string>();

export const markWebhookPull = (catalogName: string): void => {
	lastWebhookPullAt.set(catalogName, Date.now());
};

export const shouldSkipAutoPull = (catalogName: string, intervalMs: number): boolean => {
	const last = lastWebhookPullAt.get(catalogName);
	return last !== undefined && Date.now() - last < intervalMs;
};

export const tryAcquirePull = (catalogName: string): boolean => {
	if (inFlight.has(catalogName)) return false;
	inFlight.add(catalogName);
	return true;
};

export const releasePull = (catalogName: string): void => {
	inFlight.delete(catalogName);
};
