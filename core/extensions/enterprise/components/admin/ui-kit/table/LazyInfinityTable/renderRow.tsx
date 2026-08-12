import { cn } from "@core-ui/utils/cn";
import { TableCellComponent } from "@ext/enterprise/components/admin/ui-kit/table/TableCellComponent";
import {
	TABLE_EDIT_COLUMN_CODE,
	TABLE_SELECT_COLUMN_CODE,
} from "@ext/enterprise/components/admin/ui-kit/table/TableComponent";
import type { VirtualItem } from "@tanstack/react-virtual";
import type { Row } from "@ui-kit/DataTable";
import { TableRow } from "@ui-kit/Table";

interface RenderRowProps<T> {
	virtualRow: VirtualItem;
	rows: Row<T>[];
	onRowClick?: (row: Row<T>) => void;
	selectedRowIds?: number[];
	selectedRowId?: string | null;
}

export const renderRow = <T,>({
	virtualRow,
	rows,
	onRowClick,
	selectedRowIds = [],
	selectedRowId,
}: RenderRowProps<T>) => {
	const row = rows[virtualRow.index];
	const rowData = row.original as { id?: number };
	const isClickable = !!onRowClick;
	const isSelectedById = rowData.id !== undefined && selectedRowIds.length > 0 && selectedRowIds.includes(rowData.id);
	const isSelectedByRowId = selectedRowId !== null && selectedRowId !== undefined && row.id === selectedRowId;
	const isSelected = isSelectedById || isSelectedByRowId;

	return (
		<TableRow
			className={cn("h-10 items-center", isClickable && "cursor-pointer hover:bg-muted/50")}
			data-state={isSelected ? "selected" : row.getIsSelected() && "selected"}
			key={row.id}
			onClick={isClickable ? () => onRowClick(row) : undefined}
		>
			{row.getVisibleCells().map((cell) => (
				<TableCellComponent
					cell={cell}
					key={cell.id}
					onClick={
						cell.column.id === TABLE_SELECT_COLUMN_CODE
							? (e) => e.stopPropagation()
							: cell.column.id === TABLE_EDIT_COLUMN_CODE
								? () => onRowClick?.(row)
								: undefined
					}
				/>
			))}
		</TableRow>
	);
};
