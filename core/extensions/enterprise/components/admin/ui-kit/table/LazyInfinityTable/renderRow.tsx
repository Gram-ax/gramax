import { cn } from "@core-ui/utils/cn";
import {
	columnThClassName,
	TABLE_COLUMN_CODE_DEFAULT,
	TABLE_EDIT_COLUMN_CODE,
	TABLE_SELECT_COLUMN_CODE,
} from "@ext/enterprise/components/admin/ui-kit/table/TableComponent";
import type { Row } from "@tanstack/react-table";
import type { VirtualItem } from "@tanstack/react-virtual";
import { flexRender } from "@ui-kit/DataTable";
import { TableCell, TableRow } from "@ui-kit/Table";

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
			{row.getVisibleCells().map((cell, idx) => (
				<TableCell
					className={cn(
						columnThClassName[cell.column.id as keyof typeof columnThClassName] ||
							columnThClassName[TABLE_COLUMN_CODE_DEFAULT],
						idx === 0 ? "pl-3" : "",
						"overflow-hidden",
					)}
					key={cell.id}
					onClick={
						cell.column.id === TABLE_SELECT_COLUMN_CODE
							? (e) => e.stopPropagation()
							: cell.column.id === TABLE_EDIT_COLUMN_CODE
								? () => onRowClick?.(row)
								: undefined
					}
				>
					{flexRender(cell.column.columnDef.cell, cell.getContext())}
				</TableCell>
			))}
		</TableRow>
	);
};
