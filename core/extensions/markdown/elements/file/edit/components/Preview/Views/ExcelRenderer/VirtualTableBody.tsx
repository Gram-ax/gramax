import { useVirtualizer } from "@tanstack/react-virtual";
import { flexRender, type Row, type Table } from "@ui-kit/DataTable";
import { TableBody, TableCell, TableRow } from "@ui-kit/Table";
import type { HTMLAttributes, RefObject } from "react";

interface VirtualTableProps<T> extends HTMLAttributes<HTMLTableElement> {
	table: Table<T>;
	tableContainerRef: RefObject<HTMLDivElement>;
}

const VirtualTableRow = <T,>({ row }: { row: Row<T> }) => {
	return (
		<TableRow>
			{row.getVisibleCells().map((cell) => {
				return <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>;
			})}
		</TableRow>
	);
};

export const VirtualizedTableBody = <T,>({ table, tableContainerRef }: VirtualTableProps<T>) => {
	const { rows } = table.getRowModel();
	const rowVirtualizer = useVirtualizer<HTMLDivElement, HTMLTableRowElement>({
		count: rows.length,
		estimateSize: () => 33,
		getScrollElement: () => tableContainerRef.current,
		measureElement:
			typeof window !== "undefined" && navigator.userAgent.indexOf("Firefox") === -1
				? (element) => element?.getBoundingClientRect().height
				: undefined,
		overscan: 5,
	});
	return (
		<TableBody>
			<tr style={{ height: `${rowVirtualizer.getVirtualItems()[0]?.start ?? 0}px` }} />
			{rowVirtualizer.getVirtualItems().map((entry) => {
				const row = rows[entry.index];
				return <VirtualTableRow<T> key={row.id} row={row} />;
			})}
			<tr
				style={{
					height: `${rowVirtualizer.getTotalSize() - (rowVirtualizer.getVirtualItems()[rowVirtualizer.getVirtualItems().length - 1]?.end ?? 0)}px`,
				}}
			/>
		</TableBody>
	);
};
