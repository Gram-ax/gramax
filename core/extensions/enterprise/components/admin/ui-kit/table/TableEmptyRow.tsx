import t from "@ext/localization/locale/translate";
import type { ColumnDef } from "@ui-kit/DataTable";
import { EmptyState } from "@ui-kit/EmptyState";
import { TableCell, TableRow } from "@ui-kit/Table";

interface TableEmptyRowProps<T> {
	columns: ColumnDef<T>[];
}

export const TableEmptyRow = <T,>({ columns }: TableEmptyRowProps<T>) => {
	return (
		<TableRow className="hover:bg-transparent">
			<TableCell className="h-[84px] text-center p-0" colSpan={columns.length}>
				<EmptyState className="p-0">{t("empty")}</EmptyState>
			</TableCell>
		</TableRow>
	);
};
