import { useDebounce } from "@core-ui/hooks/useDebounce";
import { useCallback, useRef, useState } from "react";

const PAGE_SIZE = 25;
const SCROLL_THRESHOLD = 50;

export interface PaginatedItemsResponse {
	items: string[];
	hasMore: boolean;
	nextCursor: number | null;
}

interface UseInfiniteSelectListOptions {
	onFetch: (search?: string, limit?: number, cursor?: number) => Promise<PaginatedItemsResponse | null>;
}

export const useInfiniteSelectList = ({ onFetch }: UseInfiniteSelectListOptions) => {
	const [isLoading, setIsLoading] = useState(false);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const [items, setItems] = useState<string[]>([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [hasMore, setHasMore] = useState(true);
	const cursorRef = useRef<number | null>(null);

	const loadItems = useCallback(
		async (search?: string, cursor?: number, append = false) => {
			if (append) {
				setIsLoadingMore(true);
			} else {
				setIsLoading(true);
			}

			try {
				const response = await onFetch(search || undefined, PAGE_SIZE, cursor);
				if (response) {
					setItems((prev) => (append ? [...prev, ...response.items] : response.items));
					setHasMore(response.hasMore);
					cursorRef.current = response.nextCursor;
				}
			} finally {
				setIsLoading(false);
				setIsLoadingMore(false);
			}
		},
		[onFetch],
	);

	const loadMore = useCallback(() => {
		if (isLoadingMore || !hasMore || cursorRef.current === null) return;
		void loadItems(searchQuery || undefined, cursorRef.current, true);
	}, [isLoadingMore, hasMore, searchQuery, loadItems]);

	const { start: debouncedSearch } = useDebounce(
		async (query: string) => {
			cursorRef.current = null;
			setHasMore(true);
			await loadItems(query || undefined, undefined, false);
		},
		300,
		true,
	);

	const handleSearchChange = useCallback(
		(value: string) => {
			setSearchQuery(value);
			setIsLoading(true);
			debouncedSearch(value);
		},
		[debouncedSearch],
	);

	const handleScroll = useCallback(
		(e: React.UIEvent<HTMLDivElement>) => {
			const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
			if (scrollTop + clientHeight >= scrollHeight - SCROLL_THRESHOLD) {
				loadMore();
			}
		},
		[loadMore],
	);

	const reset = useCallback(() => {
		cursorRef.current = null;
		setHasMore(true);
		setSearchQuery("");
		setItems([]);
	}, []);

	const loadInitial = useCallback(() => {
		cursorRef.current = null;
		setHasMore(true);
		void loadItems(undefined, undefined, false);
	}, [loadItems]);

	return {
		items,
		searchQuery,
		isLoading,
		isLoadingMore,
		handleSearchChange,
		handleScroll,
		reset,
		loadInitial,
	};
};
