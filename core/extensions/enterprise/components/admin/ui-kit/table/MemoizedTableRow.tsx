import type { Row } from "@ui-kit/DataTable";
import { TableRow } from "@ui-kit/Table";
import { memo } from "react";
import { TableCellComponent } from "./TableCellComponent";
import { TABLE_EDIT_COLUMN_CODE, TABLE_SELECT_COLUMN_CODE } from "./TableComponent";

interface MemoizedTableRowProps<T> {
	row: Row<T>;
	onRowClick?: (row: Row<T>) => void;
	rowVersions?: Map<string, number>;
	rowSelection?: Record<string, boolean>;
}

const compare = <T,>(prev: MemoizedTableRowProps<T>, next: MemoizedTableRowProps<T>): boolean => {
	if (!prev.rowVersions || !prev.rowSelection) return false;

	const prevVer = prev.rowVersions?.get(prev.row.id);
	const nextVer = next.rowVersions?.get(next.row.id);
	if (prevVer !== nextVer) return false;
	if (prev.row.id !== next.row.id) return false;
	if (prev.rowSelection[prev.row.id] !== next.rowSelection[next.row.id]) return false;
	if (prev.row.original !== next.row.original) return false;
	if (prev.onRowClick !== next.onRowClick) return false;
	return true;
};

export const MemoizedTableRow = memo(
	<T,>({ row, onRowClick }: MemoizedTableRowProps<T>) => (
		<TableRow data-state={row.getIsSelected() && "selected"} key={row.id}>
			{row.getAllCells().map((cell) => (
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
	),
	compare,
) as <T>(props: MemoizedTableRowProps<T>) => React.ReactElement;
