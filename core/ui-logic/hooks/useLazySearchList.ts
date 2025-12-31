import { useCallback, useEffect, useMemo, useState } from "react";

type FilterFn<T = ListItem<unknown>> = (option: T, searchQuery: string) => number;

type ListItem<T> = T & {
	value: string;
};

interface UseLazySearchListProps<T = unknown> {
	pageSize: number;
	options: ListItem<T>[];
	filter: FilterFn<T>;
	value: string;
	defaultValue?: string;
}

export const useLazySearchList = <T = object>(props: UseLazySearchListProps<T>) => {
	const { pageSize, options, filter, value, defaultValue } = props;
	const [visibleCount, setVisibleCount] = useState(pageSize);
	const [searchQuery, setSearchQuery] = useState("");
	const [valueOption, setValueOption] = useState<T | undefined>(undefined);

	useEffect(() => setVisibleCount(pageSize), [searchQuery, pageSize]);

	useEffect(() => {
		const currentValue = value || defaultValue;
		if (currentValue && !valueOption) {
			setValueOption(options.find((option) => option.value === currentValue));
		}
	}, [defaultValue, value, options, valueOption]);

	const { visibleOptions, hasMoreItems } = useMemo(() => {
		const filteredAndRanked = searchQuery
			? options
					.map((option) => ({
						option,
						score: filter(option, searchQuery),
					}))
					.filter(({ score }) => score > 0)
					.sort((a, b) => b.score - a.score)
					.map(({ option }) => option)
			: options;

		const visible = filteredAndRanked.slice(0, visibleCount);
		const hasMore = visibleCount < filteredAndRanked.length;

		return {
			visibleOptions: visible,
			hasMoreItems: hasMore,
		};
	}, [options, searchQuery, visibleCount, filter]);

	const handleLoadMore = useCallback(() => {
		setVisibleCount((prev) => prev + pageSize);
	}, [pageSize]);

	const handleSearchChange = useCallback((value: string) => {
		setSearchQuery(value);
	}, []);

	const handleOpenChange = useCallback(
		(open: boolean) => {
			if (open && searchQuery) setSearchQuery("");
		},
		[searchQuery, setSearchQuery],
	);

	return {
		visibleOptions,
		hasMoreItems,
		handleLoadMore,
		handleSearchChange,
		handleOpenChange,
	};
};
