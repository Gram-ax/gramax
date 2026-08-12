import t from "@ext/localization/locale/translate";
import type { ColumnDef } from "@ui-kit/DataTable";

export const repoColumnId = "repo";

export interface RepoColumnOptions<T> {
	header?: string;
	getValue: (item: T) => string;
}

export const repoColumn = <T,>({ header, getValue }: RepoColumnOptions<T>): ColumnDef<T> => ({
	id: repoColumnId,
	accessorFn: getValue,
	header: header ?? t("name"),
	cell: ({ row }) => <span className="truncate text-sm">{getValue(row.original)}</span>,
});
