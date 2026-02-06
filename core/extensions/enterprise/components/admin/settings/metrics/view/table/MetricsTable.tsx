import { useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import type { SortByColumn, SortOrder } from "@ext/enterprise/components/admin/settings/metrics/filters";
import {
	LazyInfinityTable,
	type RequestData,
} from "@ext/enterprise/components/admin/ui-kit/table/LazyInfinityTable/LazyInfinityTable";
import { getCoreRowModel, useReactTable, useTableSelection } from "@ui-kit/DataTable";
import { type Dispatch, type SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChartDataPoint } from "../../types";
import { createMetricsTableColumns, type MetricsTableRow } from "./MetricsTableConfig";

interface MetricsTableProps {
	getMetricsTableData: (
		cursor?: number,
		sortBy?: string,
		sortOrder?: string,
	) => Promise<{
		data: MetricsTableRow[];
		nextCursor: number | null;
		hasMore: boolean;
	} | null>;
	loadFilteredChartData: (articleIds: number[]) => Promise<ChartDataPoint[] | null>;
	onFilteredChartDataChange: (data: ChartDataPoint[] | null) => void;
	sortBy: SortByColumn;
	sortOrder: SortOrder;
	onSortChange: (sortBy: SortByColumn, sortOrder: SortOrder) => void;
}

const MetricsTable = ({
	getMetricsTableData,
	loadFilteredChartData,
	onFilteredChartDataChange,
	sortBy,
	sortOrder,
	onSortChange,
}: MetricsTableProps) => {
	const { settings } = useSettings();
	const metricsSettings = settings?.metrics;
	// Memoize to prevent new array references on every render
	const initialData = useMemo(() => metricsSettings?.tableData ?? [], [metricsSettings?.tableData]);
	const initialHasMore = metricsSettings?.hasMore ?? true;
	const initialCursor = metricsSettings?.nextCursor ?? null;

	const [selectedArticleIds, setSelectedArticleIds] = useState<Set<number>>(new Set());
	const [rowSelection, setRowSelection] = useState({});
	const [allRows, setAllRows] = useState<MetricsTableRow[]>(initialData);
	const [hasMore, setHasMore] = useState(initialHasMore);
	const cursorRef = useRef<number | null>(initialCursor);
	const isInitialDataUsed = useRef(false);
	const isSortTriggered = useRef(false);

	const handleSortChange = useCallback(
		(columnKey: SortByColumn) => {
			if (columnKey === sortBy) {
				const newOrder = sortOrder === "desc" ? "asc" : "desc";
				onSortChange(columnKey, newOrder);
			} else {
				onSortChange(columnKey, "desc");
			}
			cursorRef.current = null;
			setHasMore(true);
			isSortTriggered.current = true;
		},
		[sortBy, sortOrder, onSortChange],
	);

	const columns = useMemo(
		() =>
			createMetricsTableColumns({
				sortBy,
				sortOrder,
				onSortChange: handleSortChange,
			}),
		[sortBy, sortOrder, handleSortChange],
	);

	const deferredSetAllRows: Dispatch<SetStateAction<MetricsTableRow[]>> = useCallback(
		(action) => {
			// This is needed because LazyInfinityTable using useWatch hook to call setData sync during render, so we defer update
			queueMicrotask(() => {
				setAllRows((prev) => {
					const newRows = typeof action === "function" ? action(prev) : action;

					// On initial mount, LazyInfinityTable clears data via useWatch. Restore initial data if available.
					// But if user triggered a sort, allow clearing to fetch fresh sorted data.
					if (
						newRows.length === 0 &&
						!isInitialDataUsed.current &&
						!isSortTriggered.current &&
						initialData.length > 0
					) {
						isInitialDataUsed.current = true;
						return initialData;
					}

					return newRows;
				});
			});
		},
		[initialData],
	);

	useEffect(() => {
		setAllRows(initialData);
		cursorRef.current = initialCursor;
		setHasMore(initialHasMore);
		isInitialDataUsed.current = false;
		isSortTriggered.current = false;
		setRowSelection({});
		setSelectedArticleIds(new Set());
	}, [initialData, initialCursor, initialHasMore]);

	const table = useReactTable({
		data: allRows,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getRowId: (row) => row.id.toString(),
		onRowSelectionChange: setRowSelection,
		state: { rowSelection },
	});

	const { getSelectedItems } = useTableSelection<MetricsTableRow>({
		table,
		isRowDisabled: () => false,
	});

	useEffect(() => {
		const selectedRows = getSelectedItems() as MetricsTableRow[];
		const newSelectedIds = new Set(selectedRows.map((row) => row.id));
		if (
			newSelectedIds.size !== selectedArticleIds.size ||
			!Array.from(newSelectedIds).every((id) => selectedArticleIds.has(id))
		) {
			setSelectedArticleIds(newSelectedIds);
			if (newSelectedIds.size === 0) {
				onFilteredChartDataChange(null);
			} else {
				loadFilteredChartData(Array.from(newSelectedIds)).then((data) => {
					onFilteredChartDataChange(data);
				});
			}
		}
	}, [getSelectedItems, selectedArticleIds, loadFilteredChartData, onFilteredChartDataChange]);

	const loadOptions = useCallback(async (): Promise<RequestData<MetricsTableRow>> => {
		const response = await getMetricsTableData(cursorRef.current ?? undefined, sortBy, sortOrder);
		if (!response) {
			return { data: [], has_more: false, next_cursor: null };
		}

		cursorRef.current = response.nextCursor;

		queueMicrotask(() => {
			setHasMore(response.hasMore);
		});

		return {
			data: response.data,
			has_more: response.hasMore,
			next_cursor: response.nextCursor ? { id: String(response.nextCursor), created_at: "" } : null,
		};
	}, [getMetricsTableData, sortBy, sortOrder]);

	return (
		<div className="flex flex-col h-full">
			<LazyInfinityTable<MetricsTableRow>
				columns={columns}
				deps={[sortBy, sortOrder]}
				hasMore={hasMore}
				loadOptions={loadOptions}
				selectedRowIds={Array.from(selectedArticleIds)}
				setData={deferredSetAllRows}
				table={table}
			/>
		</div>
	);
};

export default MetricsTable;
