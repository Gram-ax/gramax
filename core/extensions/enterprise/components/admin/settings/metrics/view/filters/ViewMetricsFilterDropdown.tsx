import FilterAnonymousSubmenu from "@ext/enterprise/components/admin/settings/metrics/components/filters/FilterAnonymousSubmenu";
import FilterDropdownTrigger from "@ext/enterprise/components/admin/settings/metrics/components/filters/FilterDropdownTrigger";
import FilterMultiSelectSubmenu from "@ext/enterprise/components/admin/settings/metrics/components/filters/FilterMultiSelectSubmenu";
import type { PaginatedItemsResponse } from "@ext/enterprise/components/admin/settings/metrics/components/filters/hooks/useInfiniteSelectList";
import type { AnonymousFilter } from "@ext/enterprise/components/admin/settings/metrics/filters";
import type {
	MetricsCatalogsResponse,
	MetricsUsersResponse,
} from "@ext/enterprise/components/admin/settings/metrics/types";
import t from "@ext/localization/locale/translate";
import { DropdownMenu, DropdownMenuContent, DropdownMenuSeparator } from "@ui-kit/Dropdown";
import { type FC, useCallback, useState } from "react";

interface ViewMetricsFilterDropdownProps {
	disabled: boolean;
	selectedCatalogs: string[];
	selectedUserEmails: string[];
	anonymousFilter: AnonymousFilter;
	onCatalogChange: (catalogs: string[]) => void;
	onUserChange: (emails: string[]) => void;
	onAnonymousChange: (value: AnonymousFilter) => void;
	getMetricsCatalogs: (search?: string, limit?: number, cursor?: number) => Promise<MetricsCatalogsResponse | null>;
	getMetricsUsers: (search?: string, limit?: number, cursor?: number) => Promise<MetricsUsersResponse | null>;
}

const ViewMetricsFilterDropdown: FC<ViewMetricsFilterDropdownProps> = (props) => {
	const {
		disabled,
		selectedCatalogs,
		selectedUserEmails,
		anonymousFilter,
		onCatalogChange,
		onUserChange,
		onAnonymousChange,
		getMetricsCatalogs,
		getMetricsUsers,
	} = props;

	const [isOpen, setIsOpen] = useState(false);

	const hasActiveFilters = selectedCatalogs.length > 0 || selectedUserEmails.length > 0 || anonymousFilter !== "all";

	const catalogFetcher = useCallback(
		async (search?: string, limit?: number, cursor?: number): Promise<PaginatedItemsResponse | null> => {
			const result = await getMetricsCatalogs(search, limit, cursor);
			return result ? { items: result.catalogs, hasMore: result.hasMore, nextCursor: result.nextCursor } : null;
		},
		[getMetricsCatalogs],
	);

	const userFetcher = useCallback(
		async (search?: string, limit?: number, cursor?: number): Promise<PaginatedItemsResponse | null> => {
			const result = await getMetricsUsers(search, limit, cursor);
			return result ? { items: result.users, hasMore: result.hasMore, nextCursor: result.nextCursor } : null;
		},
		[getMetricsUsers],
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

	const handleUserToggle = useCallback(
		(email: string) =>
			onUserChange(
				selectedUserEmails.includes(email)
					? selectedUserEmails.filter((e) => e !== email)
					: [...selectedUserEmails, email],
			),
		[selectedUserEmails, onUserChange],
	);

	return (
		<DropdownMenu onOpenChange={setIsOpen} open={isOpen}>
			<FilterDropdownTrigger disabled={disabled} hasActiveFilters={hasActiveFilters} />
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
				{anonymousFilter !== "anonymous" && (
					<FilterMultiSelectSubmenu
						clearText={t("metrics.filters.users.clear-selection")}
						fetchItems={userFetcher}
						getItemLabel={(email) => email || t("metrics.filters.users.anonymous")}
						icon="users"
						label={t("metrics.filters.users.users-filter")}
						noResultsText={t("metrics.filters.users.no-users-found")}
						onClear={() => onUserChange([])}
						onToggle={handleUserToggle}
						searchPlaceholder={t("metrics.filters.users.search-users")}
						selected={selectedUserEmails}
					/>
				)}
				<DropdownMenuSeparator />
				<FilterAnonymousSubmenu onChange={onAnonymousChange} value={anonymousFilter} />
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

export default ViewMetricsFilterDropdown;
