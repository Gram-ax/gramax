import t from "@ext/localization/locale/translate";
import type { ColumnDef } from "@ui-kit/DataTable";
import { TableCell, TableRow } from "@ui-kit/Table";

interface TableLoadingRowProps<T> {
	columns: ColumnDef<T>[];
}

export const TableLoadingRow = <T,>({ columns }: TableLoadingRowProps<T>) => {
	return (
		<TableRow>
			<TableCell className="h-full text-center" colSpan={columns.length}>
				{t("loading")}
			</TableCell>
		</TableRow>
	);
};
