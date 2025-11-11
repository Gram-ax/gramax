import t from "@ext/localization/locale/translate";
import { TableCell, TableRow } from "@ui-kit/Table";
import { ColumnDef } from "@ui-kit/DataTable";

interface TableEmptyRowProps<T> {
	columns: ColumnDef<T>[];
}

export const TableEmptyRow = <T,>({ columns }: TableEmptyRowProps<T>) => {
	return (
		<TableRow>
			<TableCell colSpan={columns.length} className="h-24 text-center">
				{t("empty")}
			</TableCell>
		</TableRow>
	);
};
