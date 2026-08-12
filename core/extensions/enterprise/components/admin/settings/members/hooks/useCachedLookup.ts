import { useCallback, useMemo } from "react";

type Resolve<T> = (keys: string[]) => Promise<T[]>;

const identity = (key: string) => key;

export const useCachedLookup = <T>(
	resolve: Resolve<T>,
	getKey: (item: T) => string,
	normalize: (key: string) => string = identity,
) => {
	// biome-ignore lint/correctness/useExhaustiveDependencies: resolve is the cache key — a new resolver means a new backend session, so the cache must drop
	const cache = useMemo(() => new Map<string, T | null>(), [resolve]);

	return useCallback(
		async (keys: string[]): Promise<T[]> => {
			const missing = new Map<string, string>();
			for (const key of keys) {
				const normalized = normalize(key);
				if (!cache.has(normalized)) missing.set(normalized, key);
			}

			if (missing.size) {
				const resolved = await resolve([...missing.values()]);
				for (const item of resolved) cache.set(normalize(getKey(item)), item);
				for (const normalized of missing.keys()) if (!cache.has(normalized)) cache.set(normalized, null);
			}

			const found: T[] = [];
			for (const key of keys) {
				const item = cache.get(normalize(key));
				if (item) found.push(item);
			}
			return found;
		},
		[cache, resolve, getKey, normalize],
	);
};
