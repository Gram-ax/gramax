import { ColumnDef, Table as ReactTable, Row } from "@ui-kit/DataTable";
import { TableBody } from "@ui-kit/Table";
import { TableEmptyRow } from "./TableEmptyRow";

type TableBodyComponentProps<T> = {
	table: ReactTable<T>;
	columns: ColumnDef<T>[];
	renderRow: (row: Row<T>) => React.ReactNode;
};

export const TableBodyComponent = <T,>({ table, columns, renderRow }: TableBodyComponentProps<T>) => {
	return (
		<TableBody>
			{table.getRowModel().rows?.length ? (
				table.getRowModel().rows.map((row) => renderRow(row))
			) : (
				<TableEmptyRow columns={columns} />
			)}
		</TableBody>
	);
};
