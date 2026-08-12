import { cn } from "@core-ui/utils/cn";
import type { ColumnDef, Row } from "@ui-kit/DataTable";
import { TableBody } from "@ui-kit/Table";
import type { RefObject } from "react";
import { TableEmptyRow } from "./TableEmptyRow";

type TableBodyComponentProps<T> = {
	rows: Row<T>[];
	columns: ColumnDef<T>[];
	renderRow: (row: Row<T>) => React.ReactNode;
	sentinelRef?: RefObject<HTMLDivElement | null>;
};

export const TableBodyComponent = <T,>(props: TableBodyComponentProps<T>) => {
	const { rows, columns, renderRow, sentinelRef } = props;
	return (
		<TableBody className={cn(sentinelRef && "[&_tr:nth-last-child(2)]:border-0")}>
			{rows.length ? rows.map((row) => renderRow(row)) : <TableEmptyRow columns={columns} />}
			{sentinelRef && (
				<tr aria-hidden className="border-0">
					<td className="p-0" colSpan={columns.length}>
						<div className="h-px" ref={sentinelRef} />
					</td>
				</tr>
			)}
		</TableBody>
	);
};
