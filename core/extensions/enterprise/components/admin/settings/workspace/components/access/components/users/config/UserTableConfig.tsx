import { TABLE_SELECT_COLUMN_CODE } from "@ext/enterprise/components/admin/ui-kit/table/TableComponent";
import { Checkbox, CheckedState } from "@ui-kit/Checkbox";
import { ColumnDef } from "@ui-kit/DataTable";
import { User } from "../types/UserTypes";
import { InvalidEmailCell } from "@ext/enterprise/components/admin/settings/components/InvalidEmailCell";
import t from "@ext/localization/locale/translate";

export const usersTableColumns: ColumnDef<User>[] = [
	{
		id: TABLE_SELECT_COLUMN_CODE,
		header: ({ table }) => (
			<Checkbox
				checked={(table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")) as CheckedState}
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
		accessorKey: "user",
		header: t("enterprise.admin.users.user"),
		cell: ({ row }) => <InvalidEmailCell value={row.original.user} />,
	},
];
