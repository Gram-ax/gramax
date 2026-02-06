import t from "@ext/localization/locale/translate";
import { ColumnDef } from "@ui-kit/DataTable";
import { Loader } from "@ui-kit/Loader";
import { TableCell, TableRow } from "@ui-kit/Table";

interface TableLoadingRowProps<T> {
	columns: ColumnDef<T>[];
}

export const TableLoadingRow = <T,>({ columns }: TableLoadingRowProps<T>) => {
	return (
		<TableRow>
			<TableCell className="h-24 text-center" colSpan={columns.length}>
				<Loader size="lg">{t("loading")}</Loader>
			</TableCell>
		</TableRow>
	);
};
