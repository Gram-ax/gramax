import { useDebounce } from "@core-ui/hooks/useDebounce";
import { useCallback, useRef, useState } from "react";

const PAGE_SIZE = 25;
const SCROLL_THRESHOLD = 50;

export interface PaginatedUsersResponse {
	users: string[];
	hasMore: boolean;
	nextCursor: number | null;
}

interface UseInfiniteScrollOptions {
	onFetch: (search?: string, limit?: number, cursor?: number) => Promise<PaginatedUsersResponse | null>;
}

export const useInfiniteScroll = ({ onFetch }: UseInfiniteScrollOptions) => {
	const [isLoading, setIsLoading] = useState(false);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const [users, setUsers] = useState<string[]>([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [hasMore, setHasMore] = useState(true);
	const cursorRef = useRef<number | null>(null);

	const loadUsers = useCallback(
		async (search?: string, cursor?: number, append = false) => {
			if (!append) {
				setIsLoading(true);
			} else {
				setIsLoadingMore(true);
			}

			try {
				const response = await onFetch(search || undefined, PAGE_SIZE, cursor);
				if (response) {
					if (append) {
						setUsers((prev) => [...prev, ...response.users]);
					} else {
						setUsers(response.users);
					}
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
		void loadUsers(searchQuery || undefined, cursorRef.current, true);
	}, [isLoadingMore, hasMore, searchQuery, loadUsers]);

	const { start: debouncedSearch } = useDebounce(
		async (query: string) => {
			cursorRef.current = null;
			setHasMore(true);
			await loadUsers(query || undefined, undefined, false);
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
		setUsers([]);
	}, []);

	const loadInitial = useCallback(() => {
		cursorRef.current = null;
		setHasMore(true);
		void loadUsers(searchQuery || undefined, undefined, false);
	}, [loadUsers, searchQuery]);

	return {
		users,
		searchQuery,
		isLoading,
		isLoadingMore,
		hasMore,
		handleSearchChange,
		handleScroll,
		reset,
		loadInitial,
	};
};
