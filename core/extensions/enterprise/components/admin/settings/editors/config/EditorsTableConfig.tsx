import { InvalidEmailCell } from "@ext/enterprise/components/admin/settings/components/InvalidEmailCell";
import t from "@ext/localization/locale/translate";
import { Checkbox, CheckedState } from "@ui-kit/Checkbox";
import { ColumnDef } from "@ui-kit/DataTable";
import { TABLE_SELECT_COLUMN_CODE } from "../../../ui-kit/table/TableComponent";
import { Editor } from "../types/EditorsComponentTypes";

export const editorsTableColumns: ColumnDef<Editor>[] = [
	{
		id: TABLE_SELECT_COLUMN_CODE,
		header: ({ table }) => (
			<Checkbox
				aria-label="Select all"
				checked={
					(table.getIsAllPageRowsSelected() ||
						(table.getIsSomePageRowsSelected() && "indeterminate")) as CheckedState
				}
				onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
			/>
		),
		cell: ({ row }) => (
			<Checkbox
				aria-label="Select row"
				checked={row.getIsSelected()}
				onCheckedChange={(value) => row.toggleSelected(!!value)}
			/>
		),
		enableSorting: false,
		enableHiding: false,
	},
	{
		accessorKey: "editor",
		header: t("enterprise.admin.roles.editor"),
		cell: ({ row }) => <InvalidEmailCell value={row.original.editor} />,
	},
];
