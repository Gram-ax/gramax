import t from "@ext/localization/locale/translate";
import { ColumnDef } from "@ui-kit/DataTable";
import { TableCell, TableRow } from "@ui-kit/Table";
import { Loader } from "@ui-kit/Loader";

interface TableLoadingRowProps<T> {
	columns: ColumnDef<T>[];
}

export const TableLoadingRow = <T,>({ columns }: TableLoadingRowProps<T>) => {
	return (
		<TableRow>
			<TableCell colSpan={columns.length} className="h-24 text-center">
				<Loader size="lg">{t("loading")}</Loader>
			</TableCell>
		</TableRow>
	);
};
