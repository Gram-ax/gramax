import { useCallback, useEffect, useRef, useState } from "react";

const DEBOUNCE_MS = 250;

export type QuerySearchFn<T> = (query: string) => Promise<T[]>;

interface UseQuerySearchArgs<T> {
	enabled: boolean;
	query: string;
	searchFn: QuerySearchFn<T>;
	onLoad?: (x: T[]) => void;
}

export const useQuerySearch = <T>(args: UseQuerySearchArgs<T>) => {
	const { enabled, query, searchFn, onLoad } = args;

	const [data, setData] = useState<T[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [isError, setIsError] = useState(false);

	const requestIdRef = useRef(0);

	const search = useCallback(
		(q: string) => {
			const requestId = ++requestIdRef.current;
			setIsLoading(true);
			setIsError(false);

			searchFn(q)
				.then((result) => {
					if (requestId !== requestIdRef.current) return;
					setData(result);
					onLoad?.(result);
					setIsLoading(false);
				})
				.catch(() => {
					if (requestId !== requestIdRef.current) return;
					setIsError(true);
					setIsLoading(false);
				});
		},
		[searchFn, onLoad],
	);

	useEffect(() => {
		if (!enabled) {
			requestIdRef.current++;
			setData([]);
			setIsLoading(false);
			setIsError(false);
			return;
		}

		setIsLoading(true);
		setData([]);
		const timer = setTimeout(() => search(query), DEBOUNCE_MS);
		return () => clearTimeout(timer);
	}, [enabled, query, search]);

	return { data, isLoading, isError };
};
