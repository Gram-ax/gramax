import { TABLE_SELECT_COLUMN_CODE } from "@ext/enterprise/components/admin/ui-kit/table/TableComponent";
import { Checkbox, CheckedState } from "@ui-kit/Checkbox";
import { ColumnDef } from "@ui-kit/DataTable";
import { Domain } from "../types/GuestsComponent";

export const guestsTableColumns: ColumnDef<Domain>[] = [
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
		accessorKey: "domain",
		header: "Домен",
	},
];
