import t from "@ext/localization/locale/translate";
import type { ColumnDef } from "@ui-kit/DataTable";

export const nameColumnId = "name";

export interface NameColumnOptions<T> {
	header?: string;
	getName: (row: T) => string;
}

export const nameColumn = <T,>({ getName, header }: NameColumnOptions<T>): ColumnDef<T> => ({
	id: nameColumnId,
	accessorFn: getName,
	header: header ?? t("name2"),
	cell: ({ row }) => {
		const item = row.original;
		const label = getName(item);
		return <span>{label}</span>;
	},
});
