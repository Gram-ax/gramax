import { flexRender } from "@ui-kit/DataTable";
import { Row } from "@tanstack/react-table";
import { VirtualItem } from "@tanstack/react-virtual";
import { TableCell, TableRow } from "@ui-kit/Table";
import {
	columnThClassName,
	TABLE_COLUMN_CODE_DEFAULT,
	TABLE_EDIT_COLUMN_CODE,
	TABLE_SELECT_COLUMN_CODE,
} from "@ext/enterprise/components/admin/ui-kit/table/TableComponent";
import { cn } from "@core-ui/utils/cn";

interface RenderRowProps<T> {
	virtualRow: VirtualItem;
	rows: Row<T>[];
	onRowClick?: (row: Row<T>) => void;
	selectedArticleIds?: number[];
}

export const renderRow = <T,>({ virtualRow, rows, onRowClick, selectedArticleIds = [] }: RenderRowProps<T>) => {
	const row = rows[virtualRow.index];
	const rowData = row.original as { id?: number };
	const isClickable = rowData.id !== undefined && onRowClick;
	const isSelected = isClickable && selectedArticleIds.length > 0 && selectedArticleIds.includes(rowData.id);

	return (
		<TableRow
			key={row.id}
			className={cn("h-10 items-center", isClickable && "cursor-pointer hover:bg-muted/50")}
			data-state={isSelected ? "selected" : row.getIsSelected() && "selected"}
			onClick={isClickable ? () => onRowClick(row) : undefined}
		>
			{row.getVisibleCells().map((cell, idx) => (
				<TableCell
					key={cell.id}
					onClick={
						cell.column.id === TABLE_SELECT_COLUMN_CODE
							? (e) => e.stopPropagation()
							: cell.column.id === TABLE_EDIT_COLUMN_CODE
							? () => onRowClick?.(row)
							: undefined
					}
					className={cn(
						columnThClassName[cell.column.id as keyof typeof columnThClassName] ||
							columnThClassName[TABLE_COLUMN_CODE_DEFAULT],
						idx === 0 ? "pl-3" : "",
						"overflow-hidden",
					)}
				>
					{flexRender(cell.column.columnDef.cell, cell.getContext())}
				</TableCell>
			))}
		</TableRow>
	);
};
