import { Spinner } from "@ext/enterprise/components/admin/ui-kit/Spinner";
import type { RequestData } from "@ext/enterprise/components/admin/ui-kit/table/LazyInfinityTable/LazyInfinityTable";
import { LazyInfinityTable } from "@ext/enterprise/components/admin/ui-kit/table/LazyInfinityTable/LazyInfinityTable";
import t from "@ext/localization/locale/translate";
import { getCoreRowModel, useReactTable } from "@ui-kit/DataTable";
import type { DependencyList } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { InitialTableData, PaginatedDataLoader, RowInteractionConfig, SortingConfig } from "./types";

interface UnifiedMetricsTableProps<TRow, TSortBy extends string = string> {
	title: string;
	dataLoader: PaginatedDataLoader<TRow>;
	sorting: SortingConfig<TSortBy, TRow>;
	getRowId: (row: TRow, index: number) => string;
	dependencies: DependencyList;
	initialData?: InitialTableData<TRow>;
	rowInteraction?: RowInteractionConfig<TRow>;
	limit?: number;
	responsive?: boolean;
}

export function UnifiedMetricsTable<TRow, TSortBy extends string = string>({
	title,
	dataLoader,
	sorting,
	getRowId,
	dependencies,
	initialData,
	rowInteraction,
	limit = 25,
	responsive = true,
}: UnifiedMetricsTableProps<TRow, TSortBy>) {
	const [tableState, setTableState] = useState<{
		rows: TRow[];
		hasMore: boolean;
		loading: boolean;
	}>(() => ({
		rows: initialData?.rows ?? [],
		hasMore: initialData?.hasMore ?? true,
		loading: false,
	}));

	const cursorRef = useRef<string | null>(initialData?.cursor ?? null);

	const dataLoaderRef = useRef(dataLoader);
	const sortingRef = useRef(sorting);
	const rowInteractionRef = useRef(rowInteraction);

	dataLoaderRef.current = dataLoader;
	sortingRef.current = sorting;
	rowInteractionRef.current = rowInteraction;

	const deferredSetRows = useCallback((newRows: TRow[] | ((prev: TRow[]) => TRow[])) => {
		queueMicrotask(() => {
			setTableState((prev) => ({
				...prev,
				rows: typeof newRows === "function" ? newRows(prev.rows) : newRows,
			}));
		});
	}, []);

	const handleSortChange = useCallback(
		(columnKey: TSortBy) => {
			if (columnKey === sorting.sortBy) {
				const newOrder = sorting.sortOrder === "desc" ? "asc" : "desc";
				sorting.onSortChange(columnKey, newOrder);
			} else {
				sorting.onSortChange(columnKey, "desc");
			}

			cursorRef.current = null;
			setTableState((prev) => ({ ...prev, hasMore: true }));
		},
		[sorting],
	);

	const columns = useMemo(
		() =>
			sorting.createSortableColumns({
				sortBy: sorting.sortBy,
				sortOrder: sorting.sortOrder,
				onSortChange: handleSortChange,
			}),
		[sorting.sortBy, sorting.sortOrder, sorting.createSortableColumns, handleSortChange],
	);

	const isInitialMount = useRef(true);

	useEffect(() => {
		if (isInitialMount.current) {
			isInitialMount.current = false;

			// On initial mount, use initialData if available
			if (initialData?.rows && initialData.rows.length > 0) {
				setTableState({
					rows: initialData.rows,
					hasMore: initialData.hasMore ?? true,
					loading: false,
				});
				cursorRef.current = initialData.cursor ?? null;
				return;
			}
		}

		// If deps changed OR no initial data, reset and fetch fresh data
		setTableState({
			rows: [],
			hasMore: true,
			loading: true,
		});
		cursorRef.current = null;

		const loadInitialData = async () => {
			try {
				const currentSorting = sortingRef.current;
				const result = await dataLoaderRef.current(
					undefined,
					currentSorting.sortBy,
					currentSorting.sortOrder,
					limit,
				);

				if (result) {
					cursorRef.current = result.nextCursor;

					setTableState({
						rows: result.data,
						hasMore: result.hasMore,
						loading: false,
					});
				} else {
					setTableState((prev) => ({ ...prev, loading: false }));
				}
			} catch (error) {
				console.error("Error loading initial table data:", error);
				setTableState((prev) => ({ ...prev, loading: false }));
			}
		};

		void loadInitialData();
		// biome-ignore lint/correctness/useExhaustiveDependencies: it uses DepList type
	}, dependencies);

	const table = useReactTable({
		data: tableState.rows,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getRowId,
	});

	const loadOptions = useCallback(async (): Promise<RequestData<TRow>> => {
		try {
			setTableState((prev) => ({ ...prev, loading: true }));

			const currentSorting = sortingRef.current;
			const result = await dataLoaderRef.current(
				cursorRef.current ?? undefined,
				currentSorting.sortBy,
				currentSorting.sortOrder,
				limit,
			);

			if (!result) {
				setTableState((prev) => ({ ...prev, loading: false }));
				return { data: [], has_more: false, next_cursor: null };
			}

			cursorRef.current = result.nextCursor;

			queueMicrotask(() => {
				setTableState((prev) => ({ ...prev, hasMore: result.hasMore, loading: false }));
			});

			return {
				data: result.data,
				has_more: result.hasMore,
				next_cursor: result.nextCursor ? { id: result.nextCursor, created_at: "" } : null,
			};
		} catch (error) {
			console.error("Error loading table data:", error);
			setTableState((prev) => ({ ...prev, loading: false }));
			return { data: [], has_more: false, next_cursor: null };
		}
	}, [limit]);

	const handleRowClick = useCallback((row: { original: TRow }) => {
		rowInteractionRef.current?.onRowClick(row.original);
	}, []);

	function renderTable() {
		if (tableState.loading && tableState.rows.length === 0) {
			return (
				<div className="flex items-center justify-center h-full">
					<Spinner size="large" />
				</div>
			);
		}

		if (!tableState.loading && tableState.rows.length === 0) {
			return (
				<div className="flex items-center justify-center h-full">
					<p className="text-muted">{t("metrics.no-data-available")}</p>
				</div>
			);
		}

		return (
			<LazyInfinityTable<TRow>
				columns={columns}
				deps={dependencies}
				hasMore={tableState.hasMore}
				loadOptions={loadOptions}
				responsive={responsive}
				setData={deferredSetRows}
				table={table}
				{...(rowInteraction && {
					onRowClick: handleRowClick,
					selectedRowId: rowInteraction.selectedRowId,
				})}
			/>
		);
	}

	return (
		<div className="flex flex-col h-full">
			<h3 className="text-lg font-semibold mb-4">{title}</h3>
			<div className="flex-1 min-h-0">{renderTable()}</div>
		</div>
	);
}
