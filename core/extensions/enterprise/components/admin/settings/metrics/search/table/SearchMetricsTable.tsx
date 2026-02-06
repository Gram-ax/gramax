import type { InitialTableData } from "@ext/enterprise/components/admin/settings/metrics/common/types";
import { UnifiedMetricsTable } from "@ext/enterprise/components/admin/settings/metrics/common/UnifiedMetricsTable";
import type { SearchSortByColumn, SortOrder } from "@ext/enterprise/components/admin/settings/metrics/filters";
import t from "@ext/localization/locale/translate";
import { memo, useMemo } from "react";
import { createSearchMetricsTableColumns, type SearchMetricsTableRow } from "./SearchMetricsTableConfig";

interface SearchMetricsTableProps {
	getSearchTableData: (
		cursor?: string,
		sortBy?: string,
		sortOrder?: string,
		limit?: number,
	) => Promise<{
		data: SearchMetricsTableRow[];
		nextCursor: string | null;
		hasMore: boolean;
	} | null>;
	initialData: InitialTableData<SearchMetricsTableRow>;
	sortBy: SearchSortByColumn;
	sortOrder: SortOrder;
	onSortChange: (tableKey: string) => (sortBy: string, sortOrder: SortOrder) => void;
	tableKey: string;
	onRowClick: (row: SearchMetricsTableRow) => void;
	selectedQuery: string | null;
}

const getRowId = (row: SearchMetricsTableRow) => row.normalizedQuery;

const SearchMetricsTableInner = ({
	getSearchTableData,
	initialData,
	sortBy,
	sortOrder,
	onSortChange,
	tableKey,
	onRowClick,
	selectedQuery,
}: SearchMetricsTableProps) => {
	console.log("searchmetricstable rendered");

	const dependencies = useMemo(() => [sortBy, sortOrder], [sortBy, sortOrder]);

	const rowInteraction = useMemo(
		() => ({
			onRowClick,
			selectedRowId: selectedQuery,
		}),
		[onRowClick, selectedQuery],
	);

	const actualSortHandler = useMemo(() => onSortChange(tableKey), [onSortChange, tableKey]);

	const sorting = useMemo(
		() => ({
			sortBy,
			sortOrder,
			onSortChange: actualSortHandler,
			createSortableColumns: createSearchMetricsTableColumns,
		}),
		[sortBy, sortOrder, actualSortHandler],
	);

	return (
		<UnifiedMetricsTable
			dataLoader={getSearchTableData}
			dependencies={dependencies}
			getRowId={getRowId}
			initialData={initialData}
			responsive={false}
			rowInteraction={rowInteraction}
			sorting={sorting}
			title={t("metrics.search.statistics-title")}
		/>
	);
};

const SearchMetricsTable = memo(SearchMetricsTableInner);

export default SearchMetricsTable;
