import FilterDropdownTrigger from "@ext/enterprise/components/admin/settings/metrics/components/filters/FilterDropdownTrigger";
import FilterMultiSelectSubmenu from "@ext/enterprise/components/admin/settings/metrics/components/filters/FilterMultiSelectSubmenu";
import type { PaginatedItemsResponse } from "@ext/enterprise/components/admin/settings/metrics/components/filters/hooks/useInfiniteSelectList";
import t from "@ext/localization/locale/translate";
import { DropdownMenu, DropdownMenuContent } from "@ui-kit/Dropdown";
import { type FC, useCallback, useState } from "react";

interface SearchMetricsFilterDropdownProps {
	disabled: boolean;
	selectedCatalogs: string[];
	onCatalogChange: (catalogs: string[]) => void;
	getMetricsCatalogs: (
		search?: string,
		limit?: number,
		cursor?: number,
	) => Promise<{ catalogs: string[]; hasMore: boolean; nextCursor: number | null } | null>;
}

const SearchMetricsFilterDropdown: FC<SearchMetricsFilterDropdownProps> = ({
	disabled,
	selectedCatalogs,
	onCatalogChange,
	getMetricsCatalogs,
}) => {
	const [isOpen, setIsOpen] = useState(false);

	const catalogFetcher = useCallback(
		async (search?: string, limit?: number, cursor?: number): Promise<PaginatedItemsResponse | null> => {
			const result = await getMetricsCatalogs(search, limit, cursor);
			return result ? { items: result.catalogs, hasMore: result.hasMore, nextCursor: result.nextCursor } : null;
		},
		[getMetricsCatalogs],
	);

	const handleCatalogToggle = useCallback(
		(catalog: string) =>
			onCatalogChange(
				selectedCatalogs.includes(catalog)
					? selectedCatalogs.filter((c) => c !== catalog)
					: [...selectedCatalogs, catalog],
			),
		[selectedCatalogs, onCatalogChange],
	);

	return (
		<DropdownMenu onOpenChange={setIsOpen} open={isOpen}>
			<FilterDropdownTrigger disabled={disabled} hasActiveFilters={selectedCatalogs.length > 0} />
			<DropdownMenuContent align="start" className="min-w-56">
				<FilterMultiSelectSubmenu
					clearText={t("metrics.filters.catalog.clear-selection")}
					fetchItems={catalogFetcher}
					icon="book-open"
					label={t("metrics.filters.catalog.placeholder")}
					noResultsText={t("metrics.filters.catalog.no-results")}
					onClear={() => onCatalogChange([])}
					onToggle={handleCatalogToggle}
					searchPlaceholder={t("metrics.filters.catalog.search")}
					selected={selectedCatalogs}
				/>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

export default SearchMetricsFilterDropdown;
