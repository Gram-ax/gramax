import { useDataCache } from "ics-ui-kit";
import { LoadOptionsParams, LoadOptionsResult, SearchSelectOption } from "ics-ui-kit/components/search-select";
import { useMemo } from "react";

export const useCache = (
	loadFunction: (
		params: LoadOptionsParams,
	) => Promise<Array<{ value: string; label: string }>> | Array<{ value: string; label: string }>,
	cacheTTL = 10 * 60 * 1000,
) => {
	const cache = useDataCache<LoadOptionsResult<SearchSelectOption>, string>({
		enabled: true,
		ttl: cacheTTL,
		keyFn: (query: string) => `multiselect-${query}`,
	});

	const loadManyOptions = useMemo(() => {
		return async (params: LoadOptionsParams): Promise<LoadOptionsResult<SearchSelectOption>> => {
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
		return async (params: LoadOptionsParams): Promise<LoadOptionsResult<SearchSelectOption>> => {
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
