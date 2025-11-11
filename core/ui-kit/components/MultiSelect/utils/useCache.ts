import { useDataCache } from "ics-ui-kit";
import { LoadOptionsParams, LoadOptionsResult, SearchSelectOption } from "ics-ui-kit/components/search-select";
import { useMemo } from "react";

export const useCache = <T extends SearchSelectOption>(
	loadFunction: (params: LoadOptionsParams) => Promise<Array<T>>,
	cacheTTL = 10 * 60 * 1000,
) => {
	const cache = useDataCache<LoadOptionsResult<T>, string>({
		enabled: true,
		ttl: cacheTTL,
		keyFn: (query: string) => `multiselect-${query}`,
	});

	const loadManyOptions = useMemo(() => {
		return async (params: LoadOptionsParams): Promise<LoadOptionsResult<T>> => {
			const options = await loadFunction(params);
			const filtered = options.filter((option) =>
				option.label.toLowerCase().includes(params.searchQuery.toLowerCase()),
			);

			return {
				options: filtered.slice(0, 50),
			};
		};
	}, [loadFunction]);

	const loadOptionsWithCache = useMemo(() => {
		return async (params: LoadOptionsParams): Promise<LoadOptionsResult<T>> => {
			const { searchQuery } = params;

			const cachedResult = cache.get(searchQuery);
			if (cachedResult) return cachedResult;
			const result = await loadManyOptions(params);

			cache.set(searchQuery, result);
			return result;
		};
	}, [cache, loadManyOptions]);

	return {
		loadOptions: loadOptionsWithCache,
		clearCache: cache.clear,
	};
};
