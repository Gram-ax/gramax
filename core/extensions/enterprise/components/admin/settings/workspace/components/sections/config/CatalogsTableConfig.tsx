import { Checkbox, CheckedState } from "@ui-kit/Checkbox";
import { ColumnDef } from "@ui-kit/DataTable";
import { Catalog } from "../types/CatalogTypes";
import {
	TABLE_DRAGGABLE_COLUMN_CODE,
	TABLE_SELECT_COLUMN_CODE,
} from "@ext/enterprise/components/admin/ui-kit/table/TableComponent";
import { TableDraggableButton } from "@ext/enterprise/components/admin/ui-kit/table/TableDraggableButton";

export const catalogsTableColumns: ColumnDef<Catalog>[] = [
	{
		id: TABLE_DRAGGABLE_COLUMN_CODE,
		enableSorting: false,
		enableHiding: false,
		cell: ({ row }) => {
			return <TableDraggableButton rowId={row.original.id} />;
		},
	},
	{
		id: TABLE_SELECT_COLUMN_CODE,
		header: ({ table }) => (
			<Checkbox
				checked={
					(table.getIsAllPageRowsSelected() ||
						(table.getIsSomePageRowsSelected() && "indeterminate")) as CheckedState
				}
				onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
				aria-label="Select all"
			/>
		),
		cell: ({ row }) => (
			<Checkbox
				checked={row.getIsSelected()}
				onCheckedChange={(value) => row.toggleSelected(!!value)}
				aria-label="Select row"
			/>
		),
		enableSorting: false,
		enableHiding: false,
	},
	{
		accessorKey: "catalog",
		header: "Название каталога",
	},
];
