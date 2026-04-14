import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Hook to handle dropdown menu with searchable content
 * @example
 * 	const { search, setSearch, contentRef, inputRef, handleContentKeyDown, handleInputKeyDown, filterItems } =
		useSearchableMenu();

	const [items, setItems] = useState<any[]>([]);

	const filteredItems = useMemo(
		() => filterItems(list.map((item) => ({ ...item, label: item.title }))),
		[items, filterItems],
	);

	<DropdownMenu>
		<DropdownMenuTrigger>{trigger}</DropdownMenuTrigger>
		<DropdownMenuContent onKeyDown={handleContentKeyDown} ref={contentRef}>
			<DropdownMenuSearchItem
				onChange={(e) => setSearch(e.target.value)}
				onClick={(e) => e.stopPropagation()}
				onKeyDown={handleInputKeyDown}
				placeholder={t("search.placeholder")}
				ref={inputRef}
				value={search}
			/>
			<DropdownMenuSeparator />
			{filteredPrompts.length === 0 ? (
				<DropdownMenuEmptyItem>no items text</DropdownMenuEmptyItem>
			) : (
				filteredItems.map((item) => (
					<DropdownMenuItem key={item.id} onClick={() => onClick(item.id)} textValue={item.title}>
						{item.title}
					</DropdownMenuItem>
				))
			)}
		</DropdownMenuContent>
	</DropdownMenu>
 */
export const useSearchableMenu = () => {
	const [search, setSearch] = useState("");

	const contentRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (!search || !contentRef.current) return;
		if (!contentRef.current.contains(document.activeElement)) {
			inputRef.current?.focus();
		}
	}, [search]);

	const handleContentKeyDown = useCallback((e: React.KeyboardEvent) => {
		if ((e.target as HTMLElement).tagName === "INPUT") return;

		const isPrintable = e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey;
		if (isPrintable) {
			setSearch((prev) => prev + e.key);
			e.preventDefault();
		} else if (e.key === "Backspace") {
			setSearch((prev) => prev.slice(0, -1));
			e.preventDefault();
		}
	}, []);

	const handleInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "ArrowDown") {
			const firstItem = contentRef.current?.querySelector<HTMLElement>("[role='menuitem']:not([data-disabled])");
			firstItem?.focus();
			e.preventDefault();
			e.stopPropagation();
		} else if (e.key === "ArrowLeft" || e.key === "Escape") {
		} else {
			e.stopPropagation();
		}
	}, []);

	const filterItems = useCallback(
		<T extends { label: string }>(items: T[]): T[] => {
			return items.filter((item) => item.label.toLowerCase().includes(search.toLowerCase()));
		},
		[search],
	);

	return {
		search,
		setSearch,
		contentRef,
		inputRef,
		handleContentKeyDown,
		handleInputKeyDown,
		filterItems,
	};
};
