import { editColumn, selectColumn } from "@ext/enterprise/components/admin/ui-kit/table/columns";
import {
	type ColumnDef,
	getCoreRowModel,
	getFilteredRowModel,
	getSortedRowModel,
	type RowSelectionState,
	type SortingState,
	useReactTable,
} from "@ui-kit/DataTable";
import { useCallback, useMemo, useState } from "react";

export interface UseSelectableTableArgs<T> {
	data: T[];
	columns: ColumnDef<T>[];
	getRowId: (row: T) => string;
	onRowClick?: (row: T) => void;
	searchColumnId?: string;
	onSearchChange?: (value: string) => void;
	sortable?: boolean;
	rowSelection: RowSelectionState;
	onRowSelectionChange: (value: RowSelectionState | ((prev: RowSelectionState) => RowSelectionState)) => void;
}

export const useSelectableTable = <T>(args: UseSelectableTableArgs<T>) => {
	const {
		data,
		columns,
		getRowId,
		onRowClick,
		searchColumnId,
		onSearchChange,
		sortable = true,
		rowSelection,
		onRowSelectionChange,
	} = args;

	const [sorting, setSorting] = useState<SortingState>([]);

	const allColumns = useMemo(
		() => [selectColumn<T>(), ...(onRowClick ? [editColumn<T>()] : []), ...columns],
		[columns, onRowClick],
	);

	const table = useReactTable({
		data,
		columns: allColumns,
		getRowId,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		...(sortable && {
			getSortedRowModel: getSortedRowModel(),
			onSortingChange: setSorting,
		}),
		onRowSelectionChange,
		state: { rowSelection, ...(sortable && { sorting }) },
		defaultColumn: { size: 0 },
	});

	const isServerSearch = Boolean(onSearchChange);
	const [serverQuery, setServerQuery] = useState("");
	const clientSearchColumn = !isServerSearch && searchColumnId ? table.getColumn(searchColumnId) : undefined;
	const searchValue = isServerSearch ? serverQuery : ((clientSearchColumn?.getFilterValue() as string) ?? "");

	const handleSearchChange = useCallback(
		(value: string | null) => {
			const next = value ?? "";
			if (isServerSearch) {
				setServerQuery(next);
				onSearchChange?.(next);
			} else {
				clientSearchColumn?.setFilterValue(next);
			}
		},
		[isServerSearch, onSearchChange, clientSearchColumn],
	);

	return { table, allColumns, searchValue, handleSearchChange };
};
