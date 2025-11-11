import { TableCell } from "@ui-kit/Table";
import { Cell, flexRender } from "@ui-kit/DataTable";
import { cn } from "@core-ui/utils/cn";
import { columnTdClassName, TABLE_COLUMN_CODE_DEFAULT } from "./TableComponent";

type TableCellComponentProps<T> = {
	cell: Cell<T, unknown>;
	idx: number;
	onClick?: (e: React.MouseEvent<HTMLTableCellElement>) => void;
};

export function TableCellComponent<T>({ cell, idx, onClick }: TableCellComponentProps<T>) {
	return (
		<TableCell
			className={cn(
				columnTdClassName[cell.column.id as keyof typeof columnTdClassName] ||
					columnTdClassName[TABLE_COLUMN_CODE_DEFAULT],
				idx === 0 ? " pl-3" : "",
			)}
			onClick={onClick}
		>
			{flexRender(cell.column.columnDef.cell, cell.getContext())}
		</TableCell>
	);
}
