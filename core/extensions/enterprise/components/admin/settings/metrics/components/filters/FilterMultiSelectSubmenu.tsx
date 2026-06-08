import type { IconCode } from "@components/Atoms/Icon/LucideIcon";
import type { PaginatedItemsResponse } from "@ext/enterprise/components/admin/settings/metrics/components/filters/hooks/useInfiniteSelectList";
import { useInfiniteSelectList } from "@ext/enterprise/components/admin/settings/metrics/components/filters/hooks/useInfiniteSelectList";
import t from "@ext/localization/locale/translate";
import {
	DropdownMenuCheckboxItem,
	DropdownMenuItem,
	DropdownMenuSearchItem,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
} from "@ui-kit/Dropdown";
import { Icon } from "@ui-kit/Icon";
import { Loader } from "@ui-kit/Loader";
import { type FC, useCallback, useMemo } from "react";

interface FilterMultiSelectSubmenuProps {
	label: string;
	icon: IconCode;
	selected: string[];
	fetchItems: (search?: string, limit?: number, cursor?: number) => Promise<PaginatedItemsResponse | null>;
	onToggle: (item: string) => void;
	onClear: () => void;
	clearText: string;
	searchPlaceholder: string;
	noResultsText: string;
	getItemLabel?: (item: string) => string;
}

const FilterMultiSelectSubmenu: FC<FilterMultiSelectSubmenuProps> = ({
	label,
	icon,
	selected,
	fetchItems,
	onToggle,
	onClear,
	clearText,
	searchPlaceholder,
	noResultsText,
	getItemLabel,
}) => {
	const { items, searchQuery, isLoading, isLoadingMore, handleSearchChange, handleScroll, reset, loadInitial } =
		useInfiniteSelectList({ onFetch: fetchItems });

	const handleOpenChange = useCallback(
		(open: boolean) => {
			if (open) {
				loadInitial();
			} else {
				reset();
			}
		},
		[loadInitial, reset],
	);

	const getLabel = useCallback((item: string) => (getItemLabel ? getItemLabel(item) : item), [getItemLabel]);

	const unifiedList = useMemo(() => {
		const list: { value: string; isSelected: boolean }[] = [];

		selected.forEach((item) => {
			if (item) list.push({ value: item, isSelected: true });
		});

		items.forEach((item) => {
			if (item && !selected.includes(item)) list.push({ value: item, isSelected: false });
		});

		return list;
	}, [selected, items]);

	const hasSelected = selected.length > 0;
	const unselectedItems = unifiedList.filter((i) => !i.isSelected);
	const showNoResultsState = !isLoading && unselectedItems.length === 0 && (searchQuery.trim() || items.length === 0);

	return (
		<DropdownMenuSub onOpenChange={handleOpenChange}>
			<DropdownMenuSubTrigger>
				<Icon className="mr-2 h-4 w-4 shrink-0" icon={icon} />
				<span>{label}</span>
				{hasSelected && <span className="ml-auto text-xs text-muted-foreground">{selected.length}</span>}
			</DropdownMenuSubTrigger>
			<DropdownMenuSubContent className="min-w-56 max-h-[400px] overflow-hidden flex flex-col p-0">
				<div className="shrink-0" onKeyDown={(e) => e.stopPropagation()}>
					<DropdownMenuSearchItem
						autoFocus
						onChange={(e) => handleSearchChange(e.target.value)}
						placeholder={searchPlaceholder}
						value={searchQuery}
					/>
				</div>
				{hasSelected && (
					<DropdownMenuItem
						className="text-muted-foreground text-sm shrink-0"
						onSelect={(e) => {
							e.preventDefault();
							onClear();
						}}
					>
						{clearText}
					</DropdownMenuItem>
				)}
				<DropdownMenuSeparator className="shrink-0" />
				<div className="overflow-y-auto flex-1" onScroll={handleScroll}>
					{/* Selected items always at top */}
					{unifiedList
						.filter((i) => i.isSelected)
						.map((item) => (
							<DropdownMenuCheckboxItem
								checked={true}
								key={item.value}
								onSelect={(e) => {
									e.preventDefault();
									onToggle(item.value);
								}}
							>
								<span className="whitespace-nowrap">{getLabel(item.value)}</span>
							</DropdownMenuCheckboxItem>
						))}

					{/* Initial loading state */}
					{isLoading && unselectedItems.length === 0 ? (
						<div className="flex items-center justify-center gap-2 py-4">
							<Loader />
							{t("metrics.filters.users.loading")}
						</div>
					) : showNoResultsState ? (
						<div className="py-4 text-center text-muted-foreground">{noResultsText}</div>
					) : (
						<>
							{unselectedItems.map((item) => (
								<DropdownMenuCheckboxItem
									checked={false}
									key={item.value}
									onSelect={(e) => {
										e.preventDefault();
										onToggle(item.value);
									}}
								>
									<span className="whitespace-nowrap">{getLabel(item.value)}</span>
								</DropdownMenuCheckboxItem>
							))}

							{isLoadingMore && (
								<div className="flex items-center justify-center gap-2 py-2">
									<Loader />
								</div>
							)}
						</>
					)}
				</div>
			</DropdownMenuSubContent>
		</DropdownMenuSub>
	);
};

export default FilterMultiSelectSubmenu;
