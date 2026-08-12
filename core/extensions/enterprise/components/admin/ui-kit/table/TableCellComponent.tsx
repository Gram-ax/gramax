import { cn } from "@core-ui/utils/cn";
import { type Cell, flexRender } from "@ui-kit/DataTable";
import { TableCell } from "@ui-kit/Table";
import { columnWidthStyle } from "./columnWidthStyle";

type TableCellComponentProps<T> = {
	cell: Cell<T, unknown>;
	onClick?: (e: React.MouseEvent<HTMLTableCellElement>) => void;
};

export function TableCellComponent<T>({ cell, onClick }: TableCellComponentProps<T>) {
	return (
		<TableCell
			className={cn(
				// biome-ignore lint/complexity/useLiteralKeys: idc
				cell.column.columnDef.meta?.["cellClassName"],
				"overflow-hidden whitespace-nowrap text-ellipsis",
			)}
			onClick={onClick}
			style={columnWidthStyle(cell.column.columnDef.size)}
		>
			{flexRender(cell.column.columnDef.cell, cell.getContext())}
		</TableCell>
	);
}
