import type { ColumnDef } from "@ui-kit/DataTable";
import type { DependencyList } from "react";

export type PaginatedDataLoader<TRow> = (
	cursor?: string,
	sortBy?: string,
	sortOrder?: string,
	limit?: number,
) => Promise<{
	data: TRow[];
	nextCursor: string | null;
	hasMore: boolean;
} | null>;

export interface InitialTableData<TRow> {
	rows: TRow[];
	cursor: string | null;
	hasMore: boolean;
}

export interface SortingConfig<TSortBy extends string = string, TRow = unknown> {
	sortBy: TSortBy;
	sortOrder: "asc" | "desc";
	onSortChange: (sortBy: TSortBy, sortOrder: "asc" | "desc") => void;
	createSortableColumns: (config: {
		sortBy: TSortBy;
		sortOrder: "asc" | "desc";
		onSortChange: (columnKey: TSortBy) => void;
	}) => ColumnDef<TRow>[];
}

export interface RowInteractionConfig<TRow> {
	onRowClick: (row: TRow) => void;
	selectedRowId?: string | null;
}

export interface UseMetricsTableConfig<TRow, TSortBy extends string = string> {
	dataLoader: PaginatedDataLoader<TRow>;
	sorting: SortingConfig<TSortBy, TRow>;
	getRowId: (row: TRow, index: number) => string;
	dependencies: DependencyList;
	initialData?: InitialTableData<TRow>;
	rowInteraction?: RowInteractionConfig<TRow>;
	title: string;
	limit?: number;
}
