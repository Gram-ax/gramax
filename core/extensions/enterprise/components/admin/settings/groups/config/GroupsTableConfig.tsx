import {
	TABLE_EDIT_COLUMN_CODE,
	TABLE_SELECT_COLUMN_CODE,
} from "@ext/enterprise/components/admin/ui-kit/table/TableComponent";
import { Checkbox, CheckedState } from "@ui-kit/Checkbox";
import { ColumnDef, useTableSelection } from "@ui-kit/DataTable";
import { Icon } from "@ui-kit/Icon";
import { Group } from "../types/GroupsComponentTypes";

export const groupTableColumns: ColumnDef<Group>[] = [
	{
		id: TABLE_SELECT_COLUMN_CODE,
		header: ({ table }) => {
			const { allSelectableSelected, someSelectableSelected, handleSelectAll } = useTableSelection({
				table,
			});

			return (
				<Checkbox
					checked={(allSelectableSelected || (someSelectableSelected && "indeterminate")) as CheckedState}
					onCheckedChange={handleSelectAll}
					aria-label="Select all"
				/>
			);
		},
		cell: ({ row }) => (
			<Checkbox
				checked={row.getIsSelected()}
				onCheckedChange={(value) => row.toggleSelected(!!value)}
				aria-label="Select row"
				disabled={row.original.disabled}
			/>
		),
		enableSorting: false,
		enableHiding: false,
	},
	{
		id: TABLE_EDIT_COLUMN_CODE,
		cell: () => <Icon icon="pen" className="text-muted" />,
		enableSorting: false,
		enableHiding: false,
	},
	{
		accessorKey: "group",
		header: "Группа",
	},
];
