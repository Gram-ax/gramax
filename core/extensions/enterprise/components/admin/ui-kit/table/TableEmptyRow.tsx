import t from "@ext/localization/locale/translate";
import { ColumnDef } from "@ui-kit/DataTable";
import { TableCell, TableRow } from "@ui-kit/Table";

interface TableEmptyRowProps<T> {
	columns: ColumnDef<T>[];
}

export const TableEmptyRow = <T,>({ columns }: TableEmptyRowProps<T>) => {
	return (
		<TableRow>
			<TableCell className="h-24 text-center" colSpan={columns.length}>
				{t("empty")}
			</TableCell>
		</TableRow>
	);
};
