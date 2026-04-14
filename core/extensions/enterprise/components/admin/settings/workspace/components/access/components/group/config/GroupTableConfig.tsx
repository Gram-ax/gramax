import { TABLE_SELECT_COLUMN_CODE } from "@ext/enterprise/components/admin/ui-kit/table/TableComponent";
import t from "@ext/localization/locale/translate";
import { Checkbox, type CheckedState } from "@ui-kit/Checkbox";
import type { ColumnDef } from "@ui-kit/DataTable";
import type { Group } from "../types/GroupTypes";
import { getGroupSourceLabel } from "../utils/groupUtils";

export const groupsTableColumns: ColumnDef<Group>[] = [
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
		accessorKey: "name",
		header: t("enterprise.admin.resources.groups.group"),
		cell: ({ row }) => <span>{row.original.name}</span>,
	},
	{
		id: "source",
		header: t("source"),
		cell: ({ row }) => <span>{getGroupSourceLabel(row.original)}</span>,
	},
];
