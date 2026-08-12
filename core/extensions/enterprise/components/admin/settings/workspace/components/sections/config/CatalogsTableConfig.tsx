import { dragColumn, selectColumn } from "@ext/enterprise/components/admin/ui-kit/table/columns";
import t from "@ext/localization/locale/translate";
import type { ColumnDef } from "@ui-kit/DataTable";
import type { Catalog } from "../types/CatalogTypes";

export const catalogsTableColumns: ColumnDef<Catalog>[] = [
	dragColumn<Catalog>(),
	selectColumn<Catalog>(),
	{
		accessorKey: "catalog",
		header: t("enterprise.admin.workspace.sections.table-header"),
		size: 0,
	},
];
