import { useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import { UnifiedMetricsTable } from "@ext/enterprise/components/admin/settings/metrics/common/UnifiedMetricsTable";
import type { SortOrder } from "@ext/enterprise/components/admin/settings/metrics/filters";
import t from "@ext/localization/locale/translate";
import { memo, useCallback, useMemo } from "react";
import {
	createSearchQueryDetailsTableColumns,
	type SearchQueryDetailRow,
	type SearchQueryDetailSortByColumn,
} from "./SearchQueryDetailsTableConfig";

interface SearchQueryDetailsTableProps {
	selectedQuery: string | null;
	startDate: string;
	endDate: string;
	sortBy: SearchQueryDetailSortByColumn;
	sortOrder: SortOrder;
	onSortChange: (tableKey: string) => (sortBy: string, sortOrder: SortOrder) => void;
	tableKey: string;
}

const getRowId = (row: SearchQueryDetailRow, index: number) => `${row.articleUrl}-${index}`;

const emptyInitialData = {
	rows: [] as SearchQueryDetailRow[],
	cursor: null,
	hasMore: true,
};

const SearchQueryDetailsTableInner = ({
	selectedQuery,
	startDate,
	endDate,
	sortBy,
	sortOrder,
	onSortChange,
	tableKey,
}: SearchQueryDetailsTableProps) => {
	const { getSearchQueryDetails } = useSettings();

	const dataLoader = useCallback(
		async (cursor?: string, sortByParam?: string, sortOrderParam?: string, limit?: number) => {
			if (!selectedQuery) return null;

			return await getSearchQueryDetails(
				selectedQuery,
				startDate,
				endDate,
				cursor,
				sortByParam ?? sortBy,
				sortOrderParam ?? sortOrder,
				limit,
			);
		},
		[selectedQuery, startDate, endDate, getSearchQueryDetails, sortBy, sortOrder],
	);

	const dependencies = useMemo(
		() => [selectedQuery, startDate, endDate, sortBy, sortOrder],
		[selectedQuery, startDate, endDate, sortBy, sortOrder],
	);

	const actualSortHandler = useMemo(() => onSortChange(tableKey), [onSortChange, tableKey]);

	const sorting = useMemo(
		() => ({
			sortBy,
			sortOrder,
			onSortChange: actualSortHandler,
			createSortableColumns: createSearchQueryDetailsTableColumns,
		}),
		[sortBy, sortOrder, actualSortHandler],
	);

	if (!selectedQuery) {
		return null;
	}

	return (
		<UnifiedMetricsTable
			dataLoader={dataLoader}
			dependencies={dependencies}
			getRowId={getRowId}
			initialData={emptyInitialData}
			responsive={false}
			sorting={sorting}
			title={t("metrics.search.query-details-title")}
		/>
	);
};

const SearchQueryDetailsTable = memo(SearchQueryDetailsTableInner);

export default SearchQueryDetailsTable;
